export { LandingClassic } from './LandingClassic';
export { LandingLuxury } from './LandingLuxury';
export { LandingMinimal } from './LandingMinimal';

export type LandingTemplate = 'classic' | 'luxury' | 'minimal';

export const LANDING_TEMPLATES = [
  { 
    id: 'classic' as const, 
    name: 'Classique', 
    description: 'Design élégant avec cartes d\'information'
  },
  { 
    id: 'luxury' as const, 
    name: 'Luxe', 
    description: 'Style premium avec effets animés et dégradés dorés'
  },
  { 
    id: 'minimal' as const, 
    name: 'Minimal', 
    description: 'Design épuré sur fond blanc'
  },
];
