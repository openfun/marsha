import React from 'react';
import { render, screen } from '@testing-library/react';

import { StudentLiveLayout } from '.';
import { imageSnapshot } from 'utils/tests/imageSnapshot';

const ActionsElement = <p>actions element</p>;
const LiveTitleElement = <p>live title element</p>;
const MainCompo = <p>main component</p>;
const PanelCompo = <p>panel component</p>;

describe('<StudentLiveLayout />', () => {
  it('renders components with panel', async () => {
    render(
      <StudentLiveLayout
        actionsElement={ActionsElement}
        isPanelOpen={true}
        liveTitleElement={LiveTitleElement}
        mainElement={MainCompo}
        sideElement={PanelCompo}
      />,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');

    const sideElenent = screen.getByText('panel component');
    expect(sideElenent).toBeVisible();

    await imageSnapshot();
  });

  it('hides the panel when isPanelOpen is false', async () => {
    render(
      <StudentLiveLayout
        actionsElement={ActionsElement}
        isPanelOpen={false}
        liveTitleElement={LiveTitleElement}
        mainElement={MainCompo}
        sideElement={PanelCompo}
      />,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');

    const sideElenent = screen.getByText('panel component');
    expect(sideElenent).not.toBeVisible();

    await imageSnapshot();
  });

  it('does not render panel when is isPanelOpen is not defined', async () => {
    render(
      <StudentLiveLayout
        actionsElement={ActionsElement}
        isPanelOpen={undefined}
        liveTitleElement={LiveTitleElement}
        mainElement={MainCompo}
        sideElement={PanelCompo}
      />,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');

    const sideElenent = screen.getByText('panel component');
    expect(sideElenent).not.toBeVisible();

    await imageSnapshot();
  });

  it('does not render panel when sideElement is not defined even if isPanelOpen is true', async () => {
    render(
      <StudentLiveLayout
        actionsElement={ActionsElement}
        isPanelOpen={true}
        liveTitleElement={LiveTitleElement}
        mainElement={MainCompo}
        sideElement={undefined}
      />,
    );

    screen.getByText('actions element');
    screen.getByText('live title element');
    screen.getByText('main component');
    expect(screen.queryByText('panel component')).not.toBeInTheDocument();

    await imageSnapshot();
  });
});
