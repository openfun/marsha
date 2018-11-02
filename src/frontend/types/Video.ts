/** Possible sizes for a video file or stream. Used as keys in lists of files. */
export type videoSize = '144' | '240' | '480' | '720' | '1080';

/** Possible states for a video.
 *
 * NB: PENDING, PROCESSING, READY and ERROR are the actual possible values
 * for the state field on a video record.
 *
 * UPLOADING does not exist as a video state on the backend side, as during
 * upload the model value for the state is still PENDING. However, here
 * on the frontend, they are two different states as far as the user is concerned.
 *
 * We add it in to make it easier to work with those states. It should not actually be
 * applied on any Video but will be used as a stand-in wherever we're passing
 * video state without the full video and need to represent this state.
 */
export enum videoState {
  ERROR = 'error',
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  UPLOADING = 'uploading',
}

/** A Video record as it exists on the backend. */
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
