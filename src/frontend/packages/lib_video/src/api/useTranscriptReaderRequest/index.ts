import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchWrapper } from 'lib-components';

export const useTranscriptReaderRequest = (
  id: string,
  url: string,
  queryConfig?: UseQueryOptions<string, 'useTranscriptReaderRequest', string>,
) => {
  return useQuery({
    queryKey: ['useTranscriptReaderRequest', id, url],
    queryFn: async () => {
      const response = await fetchWrapper(url);
      return await response.text();
    },
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
    staleTime: Infinity,
    ...queryConfig,
  });
};
