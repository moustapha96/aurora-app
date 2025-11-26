// Taux de conversion approximatifs vers EUR (à jour)
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  USD: 0.92,    // 1 USD = 0.92 EUR
  GBP: 1.16,    // 1 GBP = 1.16 EUR
  CHF: 1.05,    // 1 CHF = 1.05 EUR
  JPY: 0.0063,  // 1 JPY = 0.0063 EUR
  CNY: 0.13,    // 1 CNY = 0.13 EUR
  AED: 0.25,    // 1 AED = 0.25 EUR
  SAR: 0.24,    // 1 SAR = 0.24 EUR
};

export const convertToEuros = (
  amount: number,
  currency: string,
  unit: "M" | "Md"
): number => {
  // Convertir en milliards d'euros
  const rate = EXCHANGE_RATES[currency] || 1;
  const amountInEuros = amount * rate;
  
  // Convertir en milliards
  if (unit === "M") {
    return amountInEuros / 1000; // Millions -> Milliards
  }
  return amountInEuros; // Déjà en milliards
};
