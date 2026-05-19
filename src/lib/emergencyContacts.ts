export type EmergencyPriority = 'critical' | 'high' | 'medium';

export type EmergencyContact = {
  name: string;
  category: 'medical' | 'university' | 'police' | 'fire' | 'mental_health' | 'rescue';
  phone: string;
  priority: EmergencyPriority;
  available_24h: boolean;
  description?: string;
};

type EmergencySection = {
  title: string;
  description: string;
  categories: EmergencyContact['category'][];
  priorities: EmergencyPriority[];
};

export const emergencyContacts: EmergencyContact[] = [
  {
    name: 'Head Medic Staff',
    category: 'medical',
    phone: '0636510902',
    priority: 'critical',
    available_24h: true,
    description: 'Primary medical escalation for event operations',
  },
  {
    name: 'EMS',
    category: 'medical',
    phone: '1669',
    priority: 'critical',
    available_24h: true,
    description: 'National emergency medical service',
  },
  {
    name: 'University Hospital',
    category: 'university',
    phone: '053936150',
    priority: 'critical',
    available_24h: true,
    description: 'University hospital emergency contact',
  },
  {
    name: 'Police',
    category: 'police',
    phone: '191',
    priority: 'high',
    available_24h: true,
  },
  {
    name: 'Fire Department',
    category: 'fire',
    phone: '199',
    priority: 'high',
    available_24h: true,
  },
  {
    name: 'Poison Center',
    category: 'medical',
    phone: '1367',
    priority: 'medium',
    available_24h: true,
  },
  {
    name: 'Mental Health Hotline',
    category: 'mental_health',
    phone: '1323',
    priority: 'medium',
    available_24h: true,
  },
  {
    name: 'Local Rescue Team',
    category: 'rescue',
    phone: '',
    priority: 'medium',
    available_24h: true,
    description: 'Add local rescue phone number before event day',
  },
];

export const emergencySections: EmergencySection[] = [
  {
    title: 'Critical Emergency',
    description: 'Life-threatening symptoms, loss of consciousness, severe allergic reaction, chest pain, major injury.',
    categories: ['medical', 'university'],
    priorities: ['critical'],
  },
  {
    title: 'Medical Support',
    description: 'Medical advice, poisoning, allergy follow-up, non-life-threatening symptoms.',
    categories: ['medical'],
    priorities: ['high', 'medium'],
  },
  {
    title: 'Security Support',
    description: 'Crowd safety, violence, traffic incident, fire, lost participant, or campus security escalation.',
    categories: ['police', 'fire', 'rescue'],
    priorities: ['high', 'medium'],
  },
  {
    title: 'Mental Health Support',
    description: 'Panic attack, severe stress, self-harm concern, or urgent psychological support.',
    categories: ['mental_health'],
    priorities: ['medium'],
  },
];

export const priorityRank: Record<EmergencyPriority, number> = {
  critical: 1,
  high: 2,
  medium: 3,
};

export const priorityLabel: Record<EmergencyPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
};
