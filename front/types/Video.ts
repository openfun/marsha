type sizes = '144' | '240' | '480' | '720' | '1080';

export interface Video {
  description: string;
  id: string;
  status: string;
  title: string;
  urls: {
    jpeg: { [key in sizes]: string };
    mp4: { [key in sizes]: string };
  };
}
