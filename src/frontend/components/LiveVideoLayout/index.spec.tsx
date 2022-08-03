import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsiveContext } from 'grommet';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { useLivePanelState } from 'data/stores/useLivePanelState';
import { imageSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';

import { LiveVideoLayout } from '.';

const ActionsElement = <p>actions element</p>;
const LiveTitleElement = <p>live title element</p>;
const MainCompo = <p>main component</p>;
const PanelCompo = <p>panel component</p>;

describe('<LiveVideoLayout />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: jest.fn(),
    });
  });

  it('renders components with panel [screenshot]', async () => {
    useLivePanelState.setState({
      isPanelVisible: true,
    });

    render(
      <ResponsiveContext.Provider value="large">
        <LiveVideoLayout
          actionsElement={ActionsElement}
          displayActionsElement={true}
          isXmppReady={true}
          liveTitleElement={LiveTitleElement}
          mainElement={MainCompo}
          sideElement={PanelCompo}
        />
      </ResponsiveContext.Provider>,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');

    const sideElenent = screen.getByText('panel component');
    expect(sideElenent).toBeVisible();

    await imageSnapshot();
  });

  it('hides the panel when isPanelOpen is false [screenshot]', async () => {
    render(
      <ResponsiveContext.Provider value="large">
        <LiveVideoLayout
          actionsElement={ActionsElement}
          displayActionsElement={true}
          isXmppReady={true}
          liveTitleElement={LiveTitleElement}
          mainElement={MainCompo}
          sideElement={PanelCompo}
        />
      </ResponsiveContext.Provider>,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');

    expect(screen.queryByText('panel component')).not.toBeInTheDocument();

    await imageSnapshot();
  });

  it('does not render panel when is isPanelOpen is not defined [screenshot]', async () => {
    render(
      <ResponsiveContext.Provider value="large">
        <LiveVideoLayout
          actionsElement={ActionsElement}
          displayActionsElement={true}
          isXmppReady={true}
          liveTitleElement={LiveTitleElement}
          mainElement={MainCompo}
          sideElement={PanelCompo}
        />
      </ResponsiveContext.Provider>,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');

    expect(screen.queryByText('panel component')).not.toBeInTheDocument();

    await imageSnapshot();
  });

  it('does not render panel when sideElement is not defined even if isPanelOpen is true [screenshot]', async () => {
    render(
      <ResponsiveContext.Provider value="large">
        <LiveVideoLayout
          actionsElement={ActionsElement}
          displayActionsElement={true}
          isXmppReady={true}
          liveTitleElement={LiveTitleElement}
          mainElement={MainCompo}
          sideElement={undefined}
        />
      </ResponsiveContext.Provider>,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');
    expect(screen.queryByText('panel component')).not.toBeInTheDocument();

    await imageSnapshot();
  });

  it('does not render the actionElement when displayActionsElement is set to false', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
    });

    render(
      <ResponsiveContext.Provider value="large">
        <LiveVideoLayout
          actionsElement={ActionsElement}
          displayActionsElement={false}
          isXmppReady={true}
          liveTitleElement={LiveTitleElement}
          mainElement={MainCompo}
          sideElement={PanelCompo}
        />
      </ResponsiveContext.Provider>,
    );

    expect(screen.queryByText('actions element')).not.toBeInTheDocument();
    screen.getByText('live title element');
    screen.getByText('main component');

    const sideElenent = screen.getByText('panel component');
    expect(sideElenent).toBeVisible();
  });

  it('shows the panel when the open button is clicked', async () => {
    useLivePanelState.setState({ isPanelVisible: false });
    render(
      <LiveVideoLayout
        actionsElement={ActionsElement}
        displayActionsElement={false}
        isXmppReady={true}
        liveTitleElement={LiveTitleElement}
        mainElement={MainCompo}
        sideElement={PanelCompo}
      />,
    );

    expect(screen.queryByText('panel component')).not.toBeInTheDocument();
    const openButton = screen.getByRole('button');
    userEvent.click(openButton);
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });
});
