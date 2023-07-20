import videojsHlsjsSourceHandler from '@streamroot/videojs-hlsjs-plugin';
import { useJwt, useP2PConfig } from 'lib-components';
import { Byterange, Engine } from 'p2p-media-loader-hlsjs';
import videojs, { Player } from 'video.js';
import Plugin from 'video.js/dist/types/plugin';

import { ExtendedVideoJs, HlsData } from './types';

const PluginClass = videojs.getPlugin('plugin') as typeof Plugin;
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
export class P2pHlsPlugin extends PluginClass {
  constructor(player: Player) {
    const { stunServersUrls, webTorrentServerTrackerUrls } =
      useP2PConfig.getState();

    const { jwt } = useJwt.getState();

    videojsHlsjsSourceHandler.register(videojs);

    const engine = new Engine({
      loader: {
        trackerAnnounce: webTorrentServerTrackerUrls.map((url) => {
          const parsedUrl = new URL(url);
          if (jwt) {
            parsedUrl.searchParams.append('token', jwt);
          }
          return parsedUrl.toString();
        }),
        rtcConfig: {
          iceServers: stunServersUrls.map((url) => ({ urls: `stun:${url}` })),
        },
      },
    });

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

    /* 
    This hook is called before the videojs player is initialized.
    It is used to initialize the HLS.js events to update the engine.
    In our case, Hlsjs instance and videojsPlayer are the same object.
    And the engine is given through the player options.
    */
    (videojs as unknown as ExtendedVideoJs).Html5Hlsjs.addHook(
      'beforeinitialize',
      (videojsPlayer, hlsjs) => {
        if (typeof hlsjs.config?.loader?.getEngine === 'function') {
          this.initHlsJsEvents(
            videojsPlayer,
            hlsjs.config.loader.getEngine() as Engine,
          );
        }
      },
    );

    /* 
      The `liveSyncDurationCount` option is used to set the number of segments
      that will be downloaded before the current one. This is used to avoid
      the player to be stuck when the current segment is not available.
      The default value is 3, but we set it to 7 to be sure that the player
      will not be stuck.
      This options will be passed to the `videojs-hlsjs-plugin` library.
      Example taken from: https://github.com/Novage/p2p-media-loader/blob/master/p2p-media-loader-hlsjs/demo/videojs-hlsjs-plugin.html
    */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    player.options_.html5 = {
      hlsjsConfig: {
        liveSyncDurationCount: 7, // To have at least 7 segments in queue
        loader: engine.createLoaderClass() as unknown,
      },
    };
    super(player);
  }

  /**
   * Initialize the HLS.js events to update the engine.
   * @param {Player} player - The videojs player
   * @param {Engine} engine - The P2P engine
   * @private
   */
  private initHlsJsEvents(player: Player, engine: Engine) {
    player.on('hlsFragChanged', (_event: unknown, data: HlsData) => {
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

    player.on('hlsError', (_event: unknown, errorData: { details: string }) => {
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
