export type videoSize = '144' | '240' | '480' | '720' | '1080';

export interface Video {
  description: string;
  id: string;
  status: string;
  title: string;
  urls: {
    mp4: { [key in videoSize]: string };
    thumbnails: { [key in videoSize]: string };
  };
}
