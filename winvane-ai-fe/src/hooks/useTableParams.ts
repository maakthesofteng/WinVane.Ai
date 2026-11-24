'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface ITableParamsDefaults {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

export interface IUseTableParamsOptions {
  defaults?: ITableParamsDefaults;
  allowedSort?: string[];
  allowedPageSizes?: number[];
}

export interface ITableParams {
  page: number;
  pageSize: number;
  search: string;
  sortBy?: string;
  sortDir: 'asc' | 'desc';
  filters: Record<string, string>;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

export function useTableParams(options: IUseTableParamsOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allowedPageSizes = options.allowedPageSizes || DEFAULT_PAGE_SIZES;
  const defaultPage = options.defaults?.page || 1;
  const defaultPageSize = options.defaults?.pageSize || 10;
  const defaultSearch = options.defaults?.search || '';
  const defaultSortBy = options.defaults?.sortBy;
  const defaultSortDir = options.defaults?.sortDir || 'asc';

  // Read and validate params from URL
  const rawPage = parseInt(searchParams.get('page') || '', 10);
  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : defaultPage;

  const rawPageSize = parseInt(searchParams.get('pageSize') || '', 10);
  const pageSize = allowedPageSizes.includes(rawPageSize) ? rawPageSize : defaultPageSize;

  const urlSearch = searchParams.get('search') ?? defaultSearch;
  const [prevUrlSearch, setPrevUrlSearch] = React.useState(urlSearch);
  const [searchInput, setSearchInput] = React.useState(urlSearch);

  // Sync internal search input with URL search when URL changes externally
  if (prevUrlSearch !== urlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchInput(urlSearch);
  }

  const rawSortBy = searchParams.get('sortBy') || defaultSortBy;
  const sortBy =
    options.allowedSort && rawSortBy && !options.allowedSort.includes(rawSortBy)
      ? defaultSortBy
      : rawSortBy;

  const rawSortDir = searchParams.get('sortDir');
  const sortDir: 'asc' | 'desc' =
    rawSortDir === 'desc' || rawSortDir === 'asc' ? rawSortDir : defaultSortDir;

  // Extract extra filters (excluding table control params and tab)
  const filters = React.useMemo(() => {
    const res: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (!['page', 'pageSize', 'search', 'sortBy', 'sortDir', 'tab'].includes(key)) {
        res[key] = val;
      }
    });
    return res;
  }, [searchParams]);

  const updateUrl = React.useCallback(
    (newParams: Record<string, string | number | undefined | null>, resetPage = false) => {
      const current = new URLSearchParams(searchParams.toString());

      if (resetPage) {
        current.delete('page');
      }

      Object.entries(newParams).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '') {
          current.delete(key);
        } else {
          current.set(key, String(val));
        }
      });

      const queryString = current.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Debounce search update to URL (300ms)
  React.useEffect(() => {
    if (searchInput === urlSearch) return;

    const timer = setTimeout(() => {
      updateUrl({ search: searchInput || undefined }, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateUrl]);

  const setPage = React.useCallback(
    (newPage: number) => {
      updateUrl({ page: newPage === 1 ? undefined : newPage });
    },
    [updateUrl]
  );

  const setPageSize = React.useCallback(
    (newPageSize: number) => {
      updateUrl({ pageSize: newPageSize === defaultPageSize ? undefined : newPageSize }, true);
    },
    [defaultPageSize, updateUrl]
  );

  const setSorting = React.useCallback(
    (newSortBy?: string, newSortDir?: 'asc' | 'desc') => {
      updateUrl({ sortBy: newSortBy, sortDir: newSortDir });
    },
    [updateUrl]
  );

  const setFilter = React.useCallback(
    (key: string, value: string | undefined | null) => {
      updateUrl({ [key]: value }, true);
    },
    [updateUrl]
  );

  const reset = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const clearFilters = React.useCallback(() => {
    const current = new URLSearchParams(searchParams.toString());
    current.delete('page');
    current.delete('search');
    Object.keys(filters).forEach((key) => {
      current.delete(key);
    });
    setSearchInput('');
    const queryString = current.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router, searchParams]);

  const params: ITableParams = {
    page,
    pageSize,
    search: searchInput,
    sortBy,
    sortDir,
    filters,
  };

  return {
    params,
    page,
    pageSize,
    search: searchInput,
    sortBy,
    sortDir,
    filters,
    searchInput,
    setSearchInput,
    setSearch: setSearchInput,
    setPage,
    setPageSize,
    setSorting,
    setSort: setSorting,
    setFilter,
    reset,
    clearFilters,
  };
}
