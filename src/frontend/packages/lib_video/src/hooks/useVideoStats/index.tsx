import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { VideoStats, fetchOne } from 'lib-components';

export const useStatsVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<VideoStats, 'videos', VideoStats>,
) => {
  const key = ['videos', videoId, 'stats'];
  return useQuery<VideoStats, 'videos'>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
};
