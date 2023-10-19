import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { AppsWrapper } from '.';

describe('<AppsWrapper />', () => {
  it('renders <StudentShowAppsButton /> when panel is closed and apps is not selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(<AppsWrapper />);

    expect(
      screen.getByRole('checkbox', {
        name: 'Show apps',
      }),
    ).not.toBeChecked();
  });

  it('renders <StudentShowAppsButton /> when panel is closed and apps is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(<AppsWrapper />);

    expect(
      screen.getByRole('checkbox', {
        name: 'Show apps',
      }),
    ).not.toBeChecked();
  });

  it('renders <StudentShowAppsButton /> when panel is opened but not selecting apps', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(<AppsWrapper />);

    expect(
      screen.getByRole('checkbox', {
        name: 'Show apps',
      }),
    ).not.toBeChecked();
  });

  it('renders <StudentShowAppsButton /> when panel is opened and apps is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(<AppsWrapper />);

    expect(
      screen.getByRole('checkbox', {
        name: 'Show apps',
      }),
    ).toBeChecked();
  });
});
