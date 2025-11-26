import { Gem, Award, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currencySymbols";

interface WealthBadgeProps {
  wealthBillions: string | null;
  wealthAmount?: string | null;
  wealthUnit?: string | null;
  wealthCurrency?: string | null;
  className?: string;
}

export const WealthBadge = ({ 
  wealthBillions, 
  wealthAmount, 
  wealthUnit, 
  wealthCurrency, 
  className 
}: WealthBadgeProps) => {
  if (!wealthBillions) return null;

  const wealth = parseFloat(wealthBillions);
  
  // Vérifier le seuil minimum de 10 millions d'euros (0.01 Md)
  if (wealth < 0.01) {
    return null; // Ne pas afficher le badge si patrimoine < 10 M€
  }
  
  // Déterminer le cercle selon le montant (en milliards d'euros)
  // GOLD: 10 M€ à 30 M€ (0.01 à 0.03 Md)
  // PLATINUM: 30 M€ à 100 M€ (0.03 à 0.1 Md)
  // DIAMOND: supérieur à 100 M€ (> 0.1 Md)
  let circle: "diamond" | "platinum" | "gold";
  let circleColor: string;
  let circleBg: string;
  let CircleIcon: typeof Gem;
  
  if (wealth > 0.1) {
    // Supérieur à 100 millions = Diamond
    circle = "diamond";
    circleColor = "text-cyan-400";
    circleBg = "bg-cyan-400/20";
    CircleIcon = Gem;
  } else if (wealth >= 0.03) {
    // 30 millions à 100 millions = Platinum
    circle = "platinum";
    circleColor = "text-slate-300";
    circleBg = "bg-slate-300/20";
    CircleIcon = Award;
  } else {
    // 10 millions à 30 millions = Gold
    circle = "gold";
    circleColor = "text-gold";
    circleBg = "bg-gold/20";
    CircleIcon = Crown;
  }

  // Afficher le montant dans la monnaie d'origine (arrondi, sans décimales)
  // On utilise TOUJOURS wealthAmount (montant original) et jamais wealthBillions (converti)
  const displayAmount = wealthAmount ? Math.round(parseFloat(wealthAmount)).toString() : "";
  const displayUnit = wealthUnit || "Md";
  const currencySymbol = wealthCurrency ? getCurrencySymbol(wealthCurrency) : "€";

  return (
    <div className={cn("absolute -bottom-1 -right-1 flex flex-col items-center justify-center", className)}>
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 border-black", circleBg)}>
        <CircleIcon className={cn("w-5 h-5", circleColor)} />
      </div>
      <div className="mt-1 text-[10px] font-semibold text-gold/90 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded">
        {displayAmount} {displayUnit} {currencySymbol}
      </div>
    </div>
  );
};
