import { create } from 'zustand';

interface P2PConfigStore {
  isP2PEnabled: boolean;
  stunServersUrls: string[];
  webTorrentServerTrackerUrls: string[];
  setP2PConfig: (
    isP2PEnabled: boolean,
    stunServersUrls: string[],
    webTorrentServerTrackerUrls: string[],
  ) => void;
}

export const useP2PConfig = create<P2PConfigStore>((set) => ({
  isP2PEnabled: false,
  stunServersUrls: [],
  webTorrentServerTrackerUrls: [],
  setP2PConfig: (
    isP2PEnabled,
    stunServersUrls,
    webTorrentServerTrackerUrls,
  ) => {
    set(() => ({
      isP2PEnabled,
      stunServersUrls,
      webTorrentServerTrackerUrls,
    }));
  },
}));
