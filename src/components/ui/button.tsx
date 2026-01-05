import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-button font-sans font-medium uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Bouton principal CTA - Or chaud, texte noir
        default: "bg-primary text-primary-foreground rounded-button shadow-button hover:brightness-95 hover:shadow-gold active:scale-[0.97]",
        // Bouton premium - Gradient doré
        premium: "bg-primary text-primary-foreground rounded-button shadow-premium font-serif tracking-widest hover:brightness-95 active:scale-[0.97]",
        // Bouton secondaire - Bordure or, fond transparent
        outline: "bg-transparent border border-primary text-foreground rounded-button hover:bg-black-charcoal hover:border-gold-light",
        // Bouton secondaire alternatif
        secondary: "bg-secondary text-secondary-foreground rounded-button hover:bg-black-medium",
        // Bouton destructif
        destructive: "bg-destructive text-destructive-foreground rounded-button hover:bg-destructive/90",
        // Bouton ghost
        ghost: "hover:bg-muted hover:text-foreground rounded-button",
        // Lien
        link: "text-foreground underline-offset-4 hover:underline hover:text-primary",
        // Bouton luxury avec glow
        luxury: "bg-transparent border border-primary text-foreground rounded-button aurora-glow hover:bg-primary/5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-12 px-8 py-3",
        xl: "h-14 px-12 py-4 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
