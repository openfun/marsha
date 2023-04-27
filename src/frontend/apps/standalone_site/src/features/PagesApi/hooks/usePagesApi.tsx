import { useMemo } from 'react';

import { usePagesApi as usePages } from '../api/usePagesApi';

export const usePagesApi = () => {
  const { data } = usePages({
    keepPreviousData: true,
    staleTime: Infinity,
  });

  const routesPagesApi = useMemo(
    () => data?.results?.map((page) => `/${page.slug}`) || [],
    [data?.results],
  );

  return {
    pagesApi: data?.results || [],
    routesPagesApi,
  };
};
