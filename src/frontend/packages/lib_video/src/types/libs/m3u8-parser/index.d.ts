interface Manifest {
  playlists: { uri: string }[];
  endList?: unknown;
}

declare module 'm3u8-parser' {
  class Parser {
    constructor();
    push: (hls: string) => void;
    end: () => void;

    manifest: Manifest;
  }
}
