'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog } from '@/components/ui/dialog';
import { Volume2 } from 'lucide-react';

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

  const voices = [
    { id: 'OA001', name: 'James', description: 'Professional male voice' },
    { id: 'OA002', name: 'Emma', description: 'Friendly female voice' },
    { id: 'OA003', name: 'Michael', description: 'Authoritative male voice' },
    { id: 'OA004', name: 'Sarah', description: 'Warm female voice' },
    { id: 'OA007', name: 'David', description: 'Narrative male voice' },
  ];

  const handleSubmit = async () => {
    setIsGenerating(true);
    
    try {
      // Start progress animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
          setProgress(progress);
        }
      }, 500);
      
      // Call the API endpoint with the script and selected voice
      // Format matches the backend's expected structure
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script, // Send script exactly as entered
          tags: tags, // Send as a single string, our API will convert to the tag format
          voiceId: selectedVoice
        }),
      });
      
      const result = await response.json();
      
      // Save the video data in context
      setVideoData(result);
      
      // Complete the progress bar
      clearInterval(interval);
      setProgress(100);
      
      // Wait a moment before redirecting
      setTimeout(() => {
        router.push('/complete');
      }, 500);
      
    } catch (error) {
      console.error('Error generating video:', error);
      // Handle error - could show an error message to the user
      setIsGenerating(false);
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
        // Only allow closing programmatically, not by user action
        if (!open && isGenerating) return;
        setIsGenerating(open);
      }}>
        <GenerationProgress progress={progress} />
      </Dialog>
    </PageContainer>
  );
}