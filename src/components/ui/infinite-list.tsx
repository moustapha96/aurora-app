import React, { useEffect, useRef } from 'react';
import { useInfinitePagination } from '@/hooks/usePagination';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  pageSize?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  threshold?: number;
}

/**
 * Infinite scroll list component
 * Optimized for Android, iOS, and Web
 */
export function InfiniteList<T>({
  data,
  renderItem,
  keyExtractor,
  pageSize = 20,
  className,
  loadingComponent,
  emptyComponent,
  endComponent,
  threshold = 100,
}: InfiniteListProps<T>) {
  const { visibleData, loadMore, hasMore, isLoadingMore } = useInfinitePagination(data, {
    initialPageSize: pageSize,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore, threshold]);

  if (data.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {visibleData.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}

      {/* Sentinel element for intersection observer */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading indicator */}
      {isLoadingMore && (
        loadingComponent || (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )
      )}

      {/* End of list indicator */}
      {!hasMore && visibleData.length > 0 && endComponent}
    </div>
  );
}

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

/**
 * Simple virtualized list for very long lists
 * Uses fixed item height for performance
 */
export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  containerHeight,
  overscan = 3,
  className,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  const totalHeight = data.length * itemHeight;
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    data.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = data.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, startIndex + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InfiniteList;
