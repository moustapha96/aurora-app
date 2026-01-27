import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  /** Add cache-buster to URL automatically */
  withCacheBuster?: boolean;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, withCacheBuster = true, ...props }, ref) => {
  // Process the src to add cache-buster if needed
  const processedSrc = React.useMemo(() => {
    if (!src) return undefined;
    // Skip base64 images
    if (src.startsWith('data:')) return src;
    // Skip if already has cache-buster and withCacheBuster is true
    if (withCacheBuster && !src.includes('?t=') && !src.includes('&t=')) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}t=${Date.now()}`;
    }
    return src;
  }, [src, withCacheBuster]);

  return (
    <AvatarPrimitive.Image 
      ref={ref} 
      className={cn("aspect-square h-full w-full object-cover", className)} 
      src={processedSrc}
      {...props} 
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
