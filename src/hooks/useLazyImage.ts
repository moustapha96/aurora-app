import { useState, useEffect, useRef } from 'react';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
}

interface UseLazyImageReturn {
  ref: React.RefObject<HTMLElement>;
  isLoaded: boolean;
  isInView: boolean;
  currentSrc: string | null;
}

/**
 * Hook for lazy loading images with IntersectionObserver
 * Works on Android, iOS, and Web
 */
export const useLazyImage = (
  src: string | null | undefined,
  options: UseLazyImageOptions = {}
): UseLazyImageReturn => {
  const { threshold = 0.1, rootMargin = '50px', placeholder = null } = options;
  
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(placeholder);

  useEffect(() => {
    // Skip if no src provided
    if (!src) {
      setCurrentSrc(null);
      return;
    }

    // Check if IntersectionObserver is available (fallback for older browsers)
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      setCurrentSrc(src);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(element);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [src, threshold, rootMargin]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      console.warn('Failed to load image:', src);
      setCurrentSrc(placeholder);
      setIsLoaded(true);
    };

    img.src = src;
  }, [isInView, src, placeholder]);

  return { ref, isLoaded, isInView, currentSrc };
};

/**
 * Hook for batch lazy loading multiple images
 */
export const useLazyImages = (
  sources: (string | null | undefined)[],
  options: UseLazyImageOptions = {}
) => {
  const [loadedImages, setLoadedImages] = useState<Map<string, boolean>>(new Map());
  const [inViewImages, setInViewImages] = useState<Set<number>>(new Set());
  const refs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      const allIndexes = new Set(sources.map((_, i) => i));
      setInViewImages(allIndexes);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setInViewImages((prev) => new Set([...prev, index]));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '50px' }
    );

    refs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sources.length, options.threshold, options.rootMargin]);

  const setRef = (index: number) => (element: HTMLElement | null) => {
    if (element) {
      element.setAttribute('data-index', index.toString());
      refs.current.set(index, element);
    }
  };

  // Load images that are in view
  useEffect(() => {
    inViewImages.forEach((index) => {
      const src = sources[index];
      if (!src || loadedImages.has(src)) return;

      const img = new Image();
      img.onload = () => {
        setLoadedImages((prev) => new Map(prev).set(src, true));
      };
      img.src = src;
    });
  }, [inViewImages, sources, loadedImages]);

  return {
    setRef,
    isLoaded: (index: number) => {
      const src = sources[index];
      return src ? loadedImages.get(src) || false : false;
    },
    isInView: (index: number) => inViewImages.has(index),
  };
};
