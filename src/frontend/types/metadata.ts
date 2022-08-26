export interface ResourceMetadata {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions: object;
}

export interface VideoMetadata extends ResourceMetadata {
  live: {
    segment_duration_seconds: number;
  };
}
