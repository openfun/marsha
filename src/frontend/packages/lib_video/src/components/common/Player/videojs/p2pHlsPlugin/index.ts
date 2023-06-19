import videojsHlsjsSourceHandler from '@streamroot/videojs-hlsjs-plugin';
import { Byterange, Engine } from 'p2p-media-loader-hlsjs';
import videojs, { VideoJsPlayer } from 'video.js';

import { ExtendedVideoJs, HlsData } from './types';

const Plugin = videojs.getPlugin('plugin');

/**
 * A VideoJS Plugin enabling the P2P for HLS.
 *
 * If different players are downloading the same HLS, some segments may now
 * be shared to other players through P2P.
 *
 * The library doing this is `p2p-media-loader-core`. It uses
 * WebTorrent trackers servers and a STUN servers (By default it uses the public ones).
 *
 * See https://github.com/Novage/p2p-media-loader
 *
 * The `videojs-hlsjs-plugin` library is a plugin that will add
 * necessary metadata to make `p2p-media-loader-hlsjs` works.
 * @class P2pPlugin
 */
export class P2pHlsPlugin extends Plugin {
  constructor(player: videojs.Player, options: unknown) {
    const engine = new Engine();

    engine.on('peer_connect', (peer: { id: string; remoteAddress: string }) =>
      console.log('peer_connect', peer.id, peer.remoteAddress),
    );
    engine.on('peer_close', (peerId) => console.log('peer_close', peerId));
    engine.on('segment_loaded', (segment: { url: string }, peerId: string) =>
      console.log(
        'segment_loaded from',
        peerId ? `peer ${peerId}` : 'HTTP',
        segment.url,
      ),
    );

    videojsHlsjsSourceHandler.register(videojs);

    (videojs as unknown as ExtendedVideoJs).Html5Hlsjs.addHook(
      'beforeinitialize',
      (_videojsPlayer, hlsjs) => {
        if (typeof hlsjs.config?.loader?.getEngine === 'function') {
          this.initHlsJsEvents(hlsjs, hlsjs.config.loader.getEngine());
        }
      },
    );

    super(player, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    player.options_.html5 = {
      ...player.options_.html5,
      hlsjsConfig: {
        liveSyncDurationCount: 7, // To have at least 7 segments in queue
        loader: engine.createLoaderClass() as unknown,
      },
    };
  }

  private initHlsJsEvents(player: VideoJsPlayer, engine: Engine) {
    player.on('hlsFragChanged', (_event, data: HlsData) => {
      const frag = data.frag;
      const byterange: Byterange =
        frag.byteRange?.length !== 2
          ? undefined
          : {
              offset: frag.byteRange[0],
              length: frag.byteRange[1] - frag.byteRange[0],
            };
      engine.setPlayingSegment(frag.url, byterange, frag.start, frag.duration);
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    player.on('hlsDestroying', async () => {
      await engine.destroy();
    });

    player.on('hlsError', (_event, errorData: { details: string }) => {
      if (errorData.details === 'bufferStalledError') {
        if (player.media === undefined) {
          return;
        }
        engine.setPlayingSegmentByCurrentTime(player.media.currentTime);
      }
    });
  }
}

videojs.registerPlugin('p2pHlsPlugin', P2pHlsPlugin);
