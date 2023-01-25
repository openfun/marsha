import { ResourceMetadata, TimedText, Video } from 'lib-components';

export interface VideoMetadata extends ResourceMetadata<Video> {
  live: {
    segment_duration_seconds: number;
  };
  vod: {
    upload_max_size_bytes: number;
  };
}

export type TimedTextMetadata = ResourceMetadata<TimedText>;
