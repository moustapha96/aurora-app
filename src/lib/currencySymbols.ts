export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "CHF",
    JPY: "¥",
    CNY: "¥",
    AED: "د.إ",
    SAR: "﷼",
  };
  return symbols[currency] || currency;
};
