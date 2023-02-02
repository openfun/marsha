import { fetchOne, VideoStats } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

export const useStatsVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<VideoStats, 'videos', VideoStats>,
) => {
  const key = ['videos', videoId, 'stats'];
  return useQuery<VideoStats, 'videos'>(key, fetchOne, queryConfig);
};
