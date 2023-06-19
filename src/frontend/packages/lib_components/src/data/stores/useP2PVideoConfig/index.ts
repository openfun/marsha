import { create } from 'zustand';

interface P2PLiveConfigStore {
  isP2PEnabled: boolean;
  stunServersUrls: string[];
  webTorrentServerTrackerUrls: string[];
  setP2PLiveConfig: (
    isP2PEnabled: boolean,
    stunServersUrls: string[],
    webTorrentServerTrackerUrls: string[],
  ) => void;
}

export const useP2PLiveConfig = create<P2PLiveConfigStore>((set) => ({
  isP2PEnabled: false,
  stunServersUrls: [],
  webTorrentServerTrackerUrls: [],
  setP2PLiveConfig: (
    isP2PEnabled,
    stunServersUrls,
    webTorrentServerTrackerUrls,
  ) => {
    set((state) => ({
      ...state,
      isP2PEnabled,
      stunServersUrls,
      webTorrentServerTrackerUrls,
    }));
  },
}));
