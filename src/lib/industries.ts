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
 * Convert industry name to translation key
 */
export const getIndustryTranslationKey = (industry: string): string => {
  return `industry_${industry.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
};