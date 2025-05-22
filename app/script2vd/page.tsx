'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog } from '@/components/ui/dialog';
import { websocketService, JobStatus, JobUpdate } from '@/lib/services/websocket-service';
import { VoiceOptions } from '@/lib/types/voice';

import { PageContainer } from '@/components/layout';
import { ScriptInput, VoiceSelector, GenerationProgress } from '@/components/features/video-generator';
import { useVideoContext } from '@/lib/contexts/video-context';

export default function Script2VD() {
  const router = useRouter();
  const { setVideoData } = useVideoContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [script, setScript] = useState('');
  const [tags, setTags] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<JobStatus>('queued');
  const [jobMessage, setJobMessage] = useState<string>('');
  const [jobError, setJobError] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');

  // Use the voice options from the types file
  const voices = VoiceOptions;

  // Set up WebSocket listeners when job ID changes
  useEffect(() => {
    if (!jobId) return;
    
    // Connect to WebSocket for this job
    websocketService.connect(jobId);
    
    // Handle job updates
    const handleUpdate = (update: JobUpdate) => {
      console.log('Job update received:', update);
      setJobStatus(update.status);
      setProgress(update.progress);
      if (update.message) {
        setJobMessage(update.message);
      }
      
      // If job is completed, save the result and redirect
      if (update.status === 'completed' && update.result) {
        setVideoData({
          success: update.result.success,
          data: update.result.data
        });
        
        // Wait a moment before redirecting
        setTimeout(() => {
          router.push('/complete');
        }, 1000);
      }
      
      // If job failed, show error
      if (update.status === 'failed') {
        setJobError(update.message || 'An error occurred during video generation');
      }
    };
    
    // Handle WebSocket errors
    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      setJobError(error.message || 'Connection error');
    };
    
    // Register listeners
    websocketService.on('update', handleUpdate);
    websocketService.on('error', handleError);
    
    // Clean up listeners when component unmounts or jobId changes
    return () => {
      websocketService.off('update', handleUpdate);
      websocketService.off('error', handleError);
      websocketService.disconnect();
    };
  }, [jobId, router, setVideoData]);

  const handleSubmit = async () => {
    setIsGenerating(true);
    setJobStatus('queued');
    setProgress(0);
    setJobMessage('Submitting your request...');
    setJobError('');
    
    try {
      /** Call the API endpoint with the script and selected voice
       *  Format matches the backend's expected structure
       *  script: string
       *  tags: string
       *  voiceId: string
      */
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script,
          tags: tags,
          voiceId: selectedVoice
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.jobId) {
        throw new Error('No job ID returned from server');
      }
      
      console.log('Job created with ID:', result.jobId);
      setJobId(result.jobId);
      setJobMessage('Job created, connecting to updates...');
      
    } catch (error) {
      console.error('Error submitting video generation job:', error);
      setJobError(error instanceof Error ? error.message : 'An unknown error occurred');
      setJobStatus('failed');
      // Keep dialog open so user can see the error
    }
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <Progress value={(currentStep / 3) * 100} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Script</span>
          <span>Tags</span>
          <span>Voice</span>
        </div>
      </div>

      <Tabs value={`step${currentStep}`} className="space-y-8">
        <TabsContent value="step1" className="space-y-4">
          <h2 className="text-2xl font-bold">Enter Your Script</h2>
          <ScriptInput 
            onScriptChange={(value) => setScript(value)}
            defaultValue={script}
          />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              {script.length} characters
            </span>
            <Button onClick={() => setCurrentStep(2)}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="step2" className="space-y-4">
          <h2 className="text-2xl font-bold">Add Tags</h2>
          <Input
            placeholder="Enter tags (e.g., history, science)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(3)}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="step3" className="space-y-4">
          <h2 className="text-2xl font-bold">Select Voice</h2>
          <VoiceSelector 
            voices={voices}
            onVoiceSelect={(voiceId) => setSelectedVoice(voiceId)}
            defaultSelected={selectedVoice}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button onClick={handleSubmit}>Generate Video</Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isGenerating} onOpenChange={(open) => {
        // Only allow closing programmatically when job is not completed or failed
        if (!open && isGenerating && jobStatus !== 'completed' && jobStatus !== 'failed') return;
        setIsGenerating(open);
        
        // If manually closed, disconnect from WebSocket
        if (!open) {
          websocketService.disconnect();
        }
      }}>
        <GenerationProgress 
          progress={progress} 
          status={jobStatus}
          message={jobMessage}
          error={jobError}
        />
      </Dialog>
    </PageContainer>
  );
}