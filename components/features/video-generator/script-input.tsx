'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface ScriptInputProps {
  onScriptChange: (script: string) => void;
  defaultValue?: string;
}

export function ScriptInput({ onScriptChange, defaultValue = '' }: ScriptInputProps) {
  const [script, setScript] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setScript(newValue);
    onScriptChange(newValue);
  };

  return (
    <Card className="p-4">
      <Textarea
        placeholder="Enter your script here..."
        className="min-h-[200px] resize-none"
        value={script}
        onChange={handleChange}
      />
      <div className="mt-2 text-xs text-muted-foreground">
        <p>Write your script in natural language. Our AI will convert it into a professional video.</p>
      </div>
    </Card>
  );
}
