import create from 'zustand';

export enum LivePanelDetail {
  JOIN_DISCUSSION,
  CHAT,
  APPLICATION,
}

type State = {
  isPanelVisible: boolean;
  setPanelVisibility: (
    isVisible: boolean,
    detailToSelect?: LivePanelDetail,
  ) => void;
  availableDetails: LivePanelDetail[];
  currentDetail?: LivePanelDetail;
  selectDetail: (detailToSelect: LivePanelDetail) => void;
  setAvailableDetails: (
    details: LivePanelDetail[],
    detailToSelect?: LivePanelDetail,
  ) => void;
};

export const useLivePanelState = create<State>((set) => ({
  isPanelVisible: false,
  setPanelVisibility: (visible, detailToSelect) =>
    set((state) => ({
      isPanelVisible: visible,
      currentDetail:
        detailToSelect && state.availableDetails.includes(detailToSelect)
          ? detailToSelect
          : state.currentDetail,
    })),
  availableDetails: [],
  currentDetail: undefined,
  selectDetail: (detailToSelect) =>
    set((state) => ({
      currentDetail:
        detailToSelect && state.availableDetails.includes(detailToSelect)
          ? detailToSelect
          : state.currentDetail,
    })),
  setAvailableDetails: (details, detailToSelect) =>
    set((state) => ({
      availableDetails: details,
      currentDetail:
        detailToSelect && details.includes(detailToSelect)
          ? detailToSelect
          : state.currentDetail && details.includes(state.currentDetail)
          ? state.currentDetail
          : undefined,
    })),
}));
