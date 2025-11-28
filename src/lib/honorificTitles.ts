/**
 * Liste complète des titres honorifiques avec leurs clés de traduction
 * Basé sur le document titre.pdf fourni
 */

export type HonorificTitleKey =
  // Titres professionnels
  | 'dr_m'
  | 'dr_f'
  | 'prof_m'
  | 'prof_f'
  | 'maitre_m'
  | 'maitresse_f'
  // Titres de noblesse européens
  | 'prince'
  | 'princesse'
  | 'duc'
  | 'duchesse'
  | 'marquis'
  | 'marquise'
  | 'comte'
  | 'comtesse'
  | 'vicomte'
  | 'vicomtesse'
  | 'baron'
  | 'baronne'
  | 'chevalier'
  | 'chevaliere'
  // Titres religieux et diplomatiques
  | 'excellence_m'
  | 'excellence_f'
  | 'altesse_m'
  | 'altesse_f'
  | 'altesse_royale_m'
  | 'altesse_royale_f'
  | 'altesse_serenissime_m'
  | 'altesse_serenissime_f'
  | 'majeste_m'
  | 'majeste_f'
  | 'majeste_imperiale_m'
  | 'majeste_imperiale_f'
  | 'eminence_m'
  | 'eminence_f'
  | 'saintete_m'
  | 'saintete_f'
  // Titres du Moyen-Orient
  | 'emir'
  | 'emira'
  | 'sultan'
  | 'sultane'
  | 'cheikh'
  | 'cheikha'
  | 'moulay'
  | 'lalla'
  | 'sidi'
  // Titres japonais
  | 'tenno'
  | 'kogo'
  | 'kotaishi'
  | 'kotaishi_f'
  | 'samurai'
  | 'shogun'
  | 'daimyo'
  | 'sensei'
  // Titres russes
  | 'tsar'
  | 'tsarine'
  | 'grand_duc'
  | 'grande_duchesse'
  | 'boyard'
  | 'boyarda'
  // Titres chinois
  | 'fils_du_ciel'
  | 'empereur_chine'
  | 'imperatrice_chine'
  // Titres indiens
  | 'maharaja'
  | 'maharani'
  | 'raja'
  | 'rani'
  | 'nawab'
  // Titres thaïlandais
  | 'roi_thailande'
  | 'reine_thailande'
  // Titres coréens historiques
  | 'roi_coree'
  | 'reine_coree'
  // Titres mongols/turcs
  | 'khan'
  | 'khatoun';

export const HONORIFIC_TITLES: HonorificTitleKey[] = [
  // Titres professionnels
  'dr_m',
  'dr_f',
  'prof_m',
  'prof_f',
  'maitre_m',
  'maitresse_f',
  // Titres de noblesse européens
  'prince',
  'princesse',
  'duc',
  'duchesse',
  'marquis',
  'marquise',
  'comte',
  'comtesse',
  'vicomte',
  'vicomtesse',
  'baron',
  'baronne',
  'chevalier',
  'chevaliere',
  // Titres religieux et diplomatiques
  'excellence_m',
  'excellence_f',
  'altesse_m',
  'altesse_f',
  'altesse_royale_m',
  'altesse_royale_f',
  'altesse_serenissime_m',
  'altesse_serenissime_f',
  'majeste_m',
  'majeste_f',
  'majeste_imperiale_m',
  'majeste_imperiale_f',
  'eminence_m',
  'eminence_f',
  'saintete_m',
  'saintete_f',
  // Titres du Moyen-Orient
  'emir',
  'emira',
  'sultan',
  'sultane',
  'cheikh',
  'cheikha',
  'moulay',
  'lalla',
  'sidi',
  // Titres japonais
  'tenno',
  'kogo',
  'kotaishi',
  'kotaishi_f',
  'samurai',
  'shogun',
  'daimyo',
  'sensei',
  // Titres russes
  'tsar',
  'tsarine',
  'grand_duc',
  'grande_duchesse',
  'boyard',
  'boyarda',
  // Titres chinois
  'fils_du_ciel',
  'empereur_chine',
  'imperatrice_chine',
  // Titres indiens
  'maharaja',
  'maharani',
  'raja',
  'rani',
  'nawab',
  // Titres thaïlandais
  'roi_thailande',
  'reine_thailande',
  // Titres coréens historiques
  'roi_coree',
  'reine_coree',
  // Titres mongols/turcs
  'khan',
  'khatoun',
];

/**
 * Obtient la traduction d'un titre honorifique selon la langue
 */
export const getHonorificTitleTranslation = (
  titleKey: string | null | undefined,
  language: 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ru',
  t: (key: string) => string
): string => {
  if (!titleKey) return '';
  const translationKey = `title_${titleKey}`;
  const translation = t(translationKey);
  // Si la traduction n'existe pas, retourner la clé elle-même
  return translation !== translationKey ? translation : titleKey;
};

