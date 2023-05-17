import { create } from 'zustand';

interface useSelectFeatures {
  isSelectionEnabled: boolean;
  selectedItems: string[];
  switchSelectEnabled: () => void;
  setSelectedItems: (selectedItems: string[]) => void;
  resetSelection: () => void;
  selectItem: (
    contentId: string,
    isSelected: boolean,
    setIsSelected: (isSelected: boolean) => void,
  ) => void;
}

export const useSelectFeatures = create<useSelectFeatures>((set, get) => ({
  isSelectionEnabled: false,
  selectedItems: [],
  switchSelectEnabled: () => {
    set((state: { isSelectionEnabled: boolean }) => ({
      isSelectionEnabled: !state.isSelectionEnabled,
      selectedItems: [],
    }));
  },
  setSelectedItems: (selectedItems: string[]) => {
    return set(() => ({
      selectedItems: selectedItems,
    }));
  },
  resetSelection: () => {
    set({
      isSelectionEnabled: false,
      selectedItems: [],
    });
  },
  selectItem: (contentId, isSelected, setIsSelected) => {
    if (get().isSelectionEnabled) {
      if (isSelected) {
        get().setSelectedItems(
          get().selectedItems.filter((itemId) => itemId !== contentId),
        );
        setIsSelected(false);
      } else {
        get().setSelectedItems([...get().selectedItems, contentId]);
        setIsSelected(true);
      }
    }
  },
}));
