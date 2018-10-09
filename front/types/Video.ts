export type videoSize = '144' | '240' | '480' | '720' | '1080';

export enum videoState {
  ERROR = 'error',
  PENDING = 'pending',
  READY = 'ready',
}

export interface Video {
  description: string;
  id: string;
  state: videoState;
  title: string;
  urls: {
    manifests: {
      dash: string;
      hls: string;
    };
    mp4: { [key in videoSize]: string };
    thumbnails: { [key in videoSize]: string };
  };
}
