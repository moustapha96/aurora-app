import React, { forwardRef, useState } from 'react';
import { useLazyImage } from '@/hooks/useLazyImage';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  alt: string;
  fallback?: React.ReactNode;
  showSkeleton?: boolean;
  threshold?: number;
  rootMargin?: string;
  containerClassName?: string;
}

/**
 * Lazy loading image component with skeleton placeholder
 * Optimized for Android, iOS, and Web
 */
export const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(
  (
    {
      src,
      alt,
      fallback,
      showSkeleton = true,
      threshold = 0.1,
      rootMargin = '100px',
      className,
      containerClassName,
      ...props
    },
    forwardedRef
  ) => {
    const { ref, isLoaded, currentSrc } = useLazyImage(src, {
      threshold,
      rootMargin,
    });

    const [hasError, setHasError] = useState(false);

    const handleError = () => {
      setHasError(true);
    };

    // Combine refs
    const setRefs = (element: HTMLDivElement | null) => {
      (ref as React.MutableRefObject<HTMLElement | null>).current = element;
    };

    if (hasError && fallback) {
      return <>{fallback}</>;
    }

    return (
      <div ref={setRefs} className={cn('relative overflow-hidden', containerClassName)}>
        {/* Skeleton placeholder */}
        {showSkeleton && !isLoaded && (
          <Skeleton className={cn('absolute inset-0', className)} />
        )}

        {/* Actual image */}
        {currentSrc && (
          <img
            ref={forwardedRef}
            src={currentSrc}
            alt={alt}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            loading="lazy"
            decoding="async"
            {...props}
          />
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

interface LazyBackgroundImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string | null | undefined;
  threshold?: number;
  rootMargin?: string;
  children?: React.ReactNode;
}

/**
 * Lazy loading background image component
 */
export const LazyBackgroundImage = forwardRef<HTMLDivElement, LazyBackgroundImageProps>(
  ({ src, threshold = 0.1, rootMargin = '100px', className, children, style, ...props }, forwardedRef) => {
    const { ref, isLoaded, currentSrc } = useLazyImage(src, {
      threshold,
      rootMargin,
    });

    const setRefs = (element: HTMLDivElement | null) => {
      (ref as React.MutableRefObject<HTMLElement | null>).current = element;
      if (typeof forwardedRef === 'function') {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    };

    return (
      <div
        ref={setRefs}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          ...style,
          backgroundImage: currentSrc ? `url(${currentSrc})` : undefined,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LazyBackgroundImage.displayName = 'LazyBackgroundImage';

export default LazyImage;
