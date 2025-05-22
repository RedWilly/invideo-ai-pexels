'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Voice } from '@/lib/types/voice';

interface VoiceSelectorProps {
  voices: Voice[];
  onVoiceSelect: (voiceId: string) => void;
  defaultSelected?: string;
}

export function VoiceSelector({ voices, onVoiceSelect, defaultSelected }: VoiceSelectorProps) {
  const [selectedVoice, setSelectedVoice] = useState(defaultSelected || voices[0]?.id);

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceSelect(voiceId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {voices.map((voice) => (
        <Card
          key={voice.id}
          className={`p-4 cursor-pointer transition-all ${
            selectedVoice === voice.id
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/50'
          }`}
          onClick={() => handleVoiceSelect(voice.id)}
        >
          <div className="flex flex-col space-y-1">
            <h3 className="font-medium">{voice.name}</h3>
            <p className="text-sm text-muted-foreground">{voice.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
