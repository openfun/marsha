import { RouteOptions } from './RouteOptions';
import { Video } from './tracks';

export interface ResourceMetadata {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions: RouteOptions<Video>['actions'];
}

export interface VideoMetadata extends ResourceMetadata {
  live: {
    segment_duration_seconds: number;
  };
}
