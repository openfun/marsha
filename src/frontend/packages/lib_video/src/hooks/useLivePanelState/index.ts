import { create } from 'zustand';

export enum LivePanelItem {
  VIEWERS_LIST = 'VIEWERS_LIST',
  CHAT = 'CHAT',
  APPLICATION = 'APPLICATION',
}

type State = {
  /**
   * By default, panel is not visible and doesn't support any item
   */
  availableItems: LivePanelItem[];
  currentItem?: LivePanelItem;
  isPanelVisible: boolean;
  /**
   * config the store to set available items and current selection
   * @param items all available items in the panel
   * @param itemToSelect optional item to select
   * this item must be present in { @see items }
   * @returns void
   */
  setAvailableItems: (
    items: LivePanelItem[],
    itemToSelect?: LivePanelItem,
  ) => void;
  /**
   * open or close the panel and optionally change the selection in the panel
   * @param isVisible visibility state wanted
   * @param itemToSelect item we want to display in the panel,
   * this item must be available in { @see state.availableItems }
   * else item selection wont change
   * @returns void
   */
  setPanelVisibility: (
    isVisible: boolean,
    itemToSelect?: LivePanelItem,
  ) => void;
};

export const useLivePanelState = create<State>((set) => ({
  availableItems: [],
  currentItem: undefined,
  isPanelVisible: false,
  setAvailableItems: (items, itemToSelect) =>
    set((state) => ({
      //  update available items
      availableItems: Array.from(new Set(items)),
      //  close the pane if there is nothing to display in the panel
      isPanelVisible: state.isPanelVisible && items.length > 0,
      //  check item to select is within available items
      //  this is an invariant for components using the store
      currentItem:
        //  if target item is defined and available
        itemToSelect && items.includes(itemToSelect)
          ? //  select it
            itemToSelect
          : //  else try current item
          state.currentItem && items.includes(state.currentItem)
          ? //  select it
            state.currentItem
          : //  else try available items
          items.length > 0
          ? //  select it
            items[0]
          : //  else the current item doesn't change
            state.currentItem,
    })),
  setPanelVisibility: (isVisible, itemToSelect) =>
    set((state) => ({
      //  update panel visibility
      isPanelVisible: isVisible,
      //  check item to select is within available items
      //  this is an invariant for components using the store
      currentItem:
        itemToSelect && state.availableItems.includes(itemToSelect)
          ? itemToSelect
          : state.currentItem,
    })),
}));
