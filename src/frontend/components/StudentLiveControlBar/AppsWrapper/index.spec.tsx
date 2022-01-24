import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { AppsWrapper } from '.';

describe('<AppsWrapper />', () => {
  it('renders <StudentShowAppsButton /> when panel is closed and apps is not selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(wrapInIntlProvider(<AppsWrapper />));

    screen.getByRole('button', { name: 'Show apps' });
    expect(
      screen.queryByRole('button', { name: 'Hide apps' }),
    ).not.toBeInTheDocument();
  });
  it('renders <StudentShowAppsButton /> when panel is closed and apps is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(wrapInIntlProvider(<AppsWrapper />));

    screen.getByRole('button', { name: 'Show apps' });
    expect(
      screen.queryByRole('button', { name: 'Hide apps' }),
    ).not.toBeInTheDocument();
  });
  it('renders <StudentShowAppsButton /> when panel is opened but not selecting apps', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(wrapInIntlProvider(<AppsWrapper />));

    screen.getByRole('button', { name: 'Show apps' });
    expect(
      screen.queryByRole('button', { name: 'Hide apps' }),
    ).not.toBeInTheDocument();
  });
  it('renders <StudentShowAppsButton /> when panel is opened and apps is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.VIEWERS_LIST],
    });

    render(wrapInIntlProvider(<AppsWrapper />));

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide apps' });
  });
});
