import { LivePanelItem, useLivePanelState } from '.';

describe('useLivePanelState()', () => {
  it('init with default values', () => {
    expect(useLivePanelState.getState().availableItems).toEqual([]);
    expect(useLivePanelState.getState().currentItem).toEqual(undefined);
    expect(useLivePanelState.getState().isPanelVisible).toBe(false);
  });
});

describe('state.setAvailableItems()', () => {
  it('has no side effect without change', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    //  do not change the state with item to select
    useLivePanelState
      .getState()
      .setAvailableItems(
        [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
        LivePanelItem.CHAT,
      );

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.CHAT,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
  });

  it('closes the panel and empties available items', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    //  empty available items close the panel and select nothing
    useLivePanelState.getState().setAvailableItems([]);

    expect(useLivePanelState.getState().availableItems).toEqual([]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toBe(false);
  });

  it('updates available items and do not changes currentItem when it is still available', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    //  configure available items
    useLivePanelState.getState().setAvailableItems([LivePanelItem.CHAT]);

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
  });

  it('updates available items and current item selected with a valid current item (within set available items)', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    //  update with valid current selection
    useLivePanelState
      .getState()
      .setAvailableItems(
        [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
        LivePanelItem.APPLICATION,
      );

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.VIEWERS_LIST,
      LivePanelItem.APPLICATION,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.APPLICATION,
    );
    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
  });

  it('updates available items and prevents currentItem not beeing available (aka not within availableItems)', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    //  update with invalid current selection
    useLivePanelState
      .getState()
      .setAvailableItems(
        [LivePanelItem.VIEWERS_LIST],
        LivePanelItem.APPLICATION,
      );

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
  });

  it('removes current item from available ones and automatically selects the first one available', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    //  restrict available items
    useLivePanelState
      .getState()
      .setAvailableItems([
        LivePanelItem.APPLICATION,
        LivePanelItem.VIEWERS_LIST,
      ]);

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.APPLICATION,
    );
    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
  });

  it('ensures unicity in available states', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    useLivePanelState
      .getState()
      .setAvailableItems([
        LivePanelItem.APPLICATION,
        LivePanelItem.APPLICATION,
      ]);

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.APPLICATION,
    );
    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
  });
});

describe('state.setPanelVisibility()', () => {
  it('has no side effect', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
      currentItem: LivePanelItem.CHAT,
      isPanelVisible: true,
    });

    //  do not change the state with item to select
    useLivePanelState.getState().setPanelVisibility(true, LivePanelItem.CHAT);

    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.CHAT,
    ]);
  });

  it('updates the state changing selection with a valid item', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
      currentItem: LivePanelItem.CHAT,
      isPanelVisible: true,
    });

    //  update current item with valid item
    useLivePanelState
      .getState()
      .setPanelVisibility(true, LivePanelItem.APPLICATION);

    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.APPLICATION,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.CHAT,
    ]);
  });

  it('does not update the state changing selection with an invalid item', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
      currentItem: LivePanelItem.CHAT,
      isPanelVisible: true,
    });

    //  update current item with invalid item
    useLivePanelState
      .getState()
      .setPanelVisibility(true, LivePanelItem.VIEWERS_LIST);

    expect(useLivePanelState.getState().isPanelVisible).toBe(true);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.CHAT,
    ]);
  });

  it('updates the state closing the panel', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
      currentItem: LivePanelItem.CHAT,
      isPanelVisible: true,
    });

    //  update panel visibility
    useLivePanelState.getState().setPanelVisibility(false);

    expect(useLivePanelState.getState().isPanelVisible).toBe(false);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.CHAT,
    ]);
  });

  it('updates the state closing the panel and changing selection with a valid item', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
      currentItem: LivePanelItem.CHAT,
      isPanelVisible: true,
    });

    //  update panel visibility with valid item to select
    useLivePanelState
      .getState()
      .setPanelVisibility(false, LivePanelItem.APPLICATION);

    expect(useLivePanelState.getState().isPanelVisible).toBe(false);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.APPLICATION,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.CHAT,
    ]);
  });

  it('closes the panel and leave current item untouched', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
      currentItem: LivePanelItem.CHAT,
      isPanelVisible: true,
    });

    //  update panel visibility with invalid item to select
    useLivePanelState
      .getState()
      .setPanelVisibility(false, LivePanelItem.VIEWERS_LIST);

    expect(useLivePanelState.getState().isPanelVisible).toBe(false);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.APPLICATION,
      LivePanelItem.CHAT,
    ]);
  });
});
