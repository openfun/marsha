import { create } from 'zustand';

interface useSelectFeatures {
  isSelectionEnabled: boolean;
  selectedItems: string[];
  switchSelectEnabled: () => void;
  setSelectedItems: (selectedItems: string[]) => void;
  resetSelection: () => void;
  selectItem: (contentId: string, isSelected: boolean) => void;
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
  selectItem: (contentId, isSelected) => {
    if (get().isSelectionEnabled) {
      if (isSelected) {
        get().setSelectedItems(
          get().selectedItems.filter((itemId) => itemId !== contentId),
        );
      } else {
        get().setSelectedItems([...get().selectedItems, contentId]);
      }
    }
  },
}));
