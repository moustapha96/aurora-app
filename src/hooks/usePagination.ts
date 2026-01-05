import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  paginatedData: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  startIndex: number;
  endIndex: number;
}

/**
 * Hook for client-side pagination
 * Works on Android, iOS, and Web
 */
export const usePagination = <T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> => {
  const { initialPage = 1, initialPageSize = 10 } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Ensure current page is valid when data changes
  const validCurrentPage = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      return totalPages;
    }
    if (currentPage < 1) {
      return 1;
    }
    return currentPage;
  }, [currentPage, totalPages]);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, validCurrentPage, pageSize]);

  const hasNextPage = validCurrentPage < totalPages;
  const hasPreviousPage = validCurrentPage > 1;

  const goToPage = useCallback((page: number) => {
    const targetPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(targetPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const startIndex = (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalItems);

  return {
    currentPage: validCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    startIndex,
    endIndex,
  };
};

interface UseInfinitePaginationOptions {
  initialPageSize?: number;
}

interface UseInfinitePaginationReturn<T> {
  visibleData: T[];
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  reset: () => void;
  loadedCount: number;
  totalCount: number;
}

/**
 * Hook for infinite scroll pagination (mobile-optimized)
 * Works on Android, iOS, and Web
 */
export const useInfinitePagination = <T>(
  data: T[],
  options: UseInfinitePaginationOptions = {}
): UseInfinitePaginationReturn<T> => {
  const { initialPageSize = 20 } = options;
  
  const [loadedCount, setLoadedCount] = useState(initialPageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const totalCount = data.length;
  const hasMore = loadedCount < totalCount;

  const visibleData = useMemo(() => {
    return data.slice(0, loadedCount);
  }, [data, loadedCount]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    
    // Simulate async loading for smoother UX
    requestAnimationFrame(() => {
      setLoadedCount((prev) => Math.min(prev + initialPageSize, totalCount));
      setIsLoadingMore(false);
    });
  }, [hasMore, isLoadingMore, initialPageSize, totalCount]);

  const reset = useCallback(() => {
    setLoadedCount(initialPageSize);
  }, [initialPageSize]);

  return {
    visibleData,
    loadMore,
    hasMore,
    isLoadingMore,
    reset,
    loadedCount,
    totalCount,
  };
};

/**
 * Hook for cursor-based pagination (Supabase optimized)
 */
interface UseCursorPaginationOptions<T> {
  pageSize?: number;
  cursorField?: keyof T;
}

interface UseCursorPaginationReturn<T> {
  cursor: string | null;
  setCursor: (cursor: string | null) => void;
  pageSize: number;
  buildQuery: (baseQuery: any) => any;
  reset: () => void;
}

export const useCursorPagination = <T>(
  options: UseCursorPaginationOptions<T> = {}
): UseCursorPaginationReturn<T> => {
  const { pageSize = 20, cursorField = 'id' as keyof T } = options;
  
  const [cursor, setCursor] = useState<string | null>(null);

  const buildQuery = useCallback((baseQuery: any) => {
    let query = baseQuery.limit(pageSize + 1); // Fetch one extra to check if there's more
    
    if (cursor) {
      query = query.gt(cursorField, cursor);
    }
    
    return query;
  }, [cursor, pageSize, cursorField]);

  const reset = useCallback(() => {
    setCursor(null);
  }, []);

  return {
    cursor,
    setCursor,
    pageSize,
    buildQuery,
    reset,
  };
};
