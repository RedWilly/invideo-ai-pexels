export interface Voice {
  id: string;
  name: string;
  description: string;
}

export const VoiceOptions: Voice[] = [
  { id: 'OA001', name: 'Alloy', description: 'Neutral, professional, and clear' },
  { id: 'OA002', name: 'Echo', description: 'Warm, friendly, and engaging' },
  { id: 'OA003', name: 'Fable', description: 'Energetic, expressive, and engaging' },
  { id: 'OA004', name: 'Onyx', description: 'Older, mature, and experienced' },
  { id: 'OA007', name: 'Ash', description: 'Enthusiastic, energetic, and lively' },
];

export enum VoiceId {
  ALLOY = 'OA001',
  ECHO = 'OA002',
  FABLE = 'OA003',
  ONYX = 'OA004',
  ASH = 'OA007'
}
