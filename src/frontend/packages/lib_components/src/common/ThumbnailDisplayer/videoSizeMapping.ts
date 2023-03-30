import { videoSize } from '@lib-components/types/tracks';

// Mappping object between a video height and its corresponding width in a 16:9 ratio
export const videoSizeMapping: Readonly<{ [key in videoSize]: string }> = {
  144: '256',
  240: '426',
  480: '854',
  720: '1280',
  1080: '1920',
};
