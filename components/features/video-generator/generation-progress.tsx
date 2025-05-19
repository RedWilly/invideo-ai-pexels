'use client';

import { Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';

interface GenerationProgressProps {
  progress: number;
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  return (
    <DialogContent className="sm:max-w-md">
      {/* Empty div to prevent close button from appearing */}
      <div className="absolute right-4 top-4"></div>
      <DialogTitle>Generating Video</DialogTitle>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Play className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Generating Your Video</h2>
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-muted-foreground">
          Please wait while we create your video...
        </p>
      </div>
    </DialogContent>
  );
}
