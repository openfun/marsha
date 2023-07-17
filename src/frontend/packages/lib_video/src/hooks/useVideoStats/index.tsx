import { VideoStats, fetchOne } from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

export const useStatsVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<VideoStats, 'videos', VideoStats>,
) => {
  const key = ['videos', videoId, 'stats'];
  return useQuery<VideoStats, 'videos'>(key, fetchOne, queryConfig);
};
