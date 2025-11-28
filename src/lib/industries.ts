export const INDUSTRIES = [
  "Technology & Software",
  "Finance & Banking",
  "Healthcare & Pharmaceuticals",
  "Manufacturing & Industry",
  "Retail & E-commerce",
  "Real Estate & Construction",
  "Energy & Utilities",
  "Transportation & Logistics",
  "Media & Entertainment",
  "Consulting & Professional Services",
  "Education & Training",
  "Hospitality & Tourism",
  "Telecommunications",
  "Agriculture & Food",
  "Fashion & Luxury Goods",
  "Art & Culture",
  "Sports & Recreation",
  "Non-Profit & NGO",
  "Government & Public Sector",
  "Legal Services",
  "Automotive",
  "Aerospace & Defense",
  "Biotechnology",
  "Chemical",
  "Environmental Services",
] as const;

export type Industry = typeof INDUSTRIES[number];

/**
 * Mapping of industry names to their translation keys
 * This ensures consistency with the translation keys in LanguageContext.tsx
 */
const INDUSTRY_KEY_MAP: Record<string, string> = {
  "Retail & E-commerce": "industry_retail_ecommerce",
  "Non-Profit & NGO": "industry_nonprofit_ngo",
};

/**
 * Convert industry name to translation key
 * Handles special cases explicitly, then uses a general conversion for others
 */
export const getIndustryTranslationKey = (industry: string): string => {
  // Check if there's an explicit mapping
  if (INDUSTRY_KEY_MAP[industry]) {
    return INDUSTRY_KEY_MAP[industry];
  }
  
  // General conversion: lowercase, replace non-alphanumeric with underscores, clean up
  let key = industry.toLowerCase();
  // Remove hyphens between letters (e.g., "e-commerce" -> "ecommerce")
  key = key.replace(/([a-z])-([a-z])/gi, '$1$2');
  // Replace remaining non-alphanumeric characters with underscores
  key = key.replace(/[^a-z0-9]+/g, '_');
  // Remove leading/trailing underscores and collapse multiple underscores
  key = key.replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `industry_${key}`;
};