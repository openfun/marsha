import React from 'react';
import { render, screen } from '@testing-library/react';

import { LiveStudentLayout } from '.';

const MainCompo = <p>main component</p>;
const PanelCompo = <p>panel component</p>;
const BottomCompo = <p>bottom compo</p>;

describe('<LiveStudentLayout />', () => {
  it('render components with panel', () => {
    const LiveCompo = (
      <LiveStudentLayout
        mainElement={MainCompo}
        sideElement={PanelCompo}
        isPanelOpen={true}
        bottomElement={BottomCompo}
      />
    );

    render(LiveCompo);

    screen.getByText('main component');
    screen.getByText('panel component');
    screen.getByText('bottom compo');
  });

  it('does not render panel when is isPanelOpen is false', () => {
    const LiveCompo = (
      <LiveStudentLayout
        mainElement={MainCompo}
        sideElement={PanelCompo}
        isPanelOpen={false}
        bottomElement={BottomCompo}
      />
    );

    render(LiveCompo);

    screen.getByText('main component');
    expect(screen.queryByText('panel component')).toBeNull();
    screen.getByText('bottom compo');
  });

  it('does not render panel when is isPanelOpen is not defined', () => {
    const LiveCompo = (
      <LiveStudentLayout
        mainElement={MainCompo}
        sideElement={PanelCompo}
        bottomElement={BottomCompo}
      />
    );

    render(LiveCompo);

    screen.getByText('main component');
    expect(screen.queryByText('panel component')).toBeNull();
    screen.getByText('bottom compo');
  });

  it('does not render panel when sideElement is not defined even if isPanelOpen is true', () => {
    const LiveCompo = (
      <LiveStudentLayout
        mainElement={MainCompo}
        isPanelOpen={true}
        bottomElement={BottomCompo}
      />
    );

    render(LiveCompo);

    screen.getByText('main component');
    expect(screen.queryByText('panel component')).toBeNull();
    screen.getByText('bottom compo');
  });
});
