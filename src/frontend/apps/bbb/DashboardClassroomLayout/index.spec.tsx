import React from 'react';

import render from 'utils/tests/render';

import { DashboardClassroomLayout } from './index';

jest.mock('data/appData', () => ({
  appData: {
    static: {
      img: {
        bbbBackground: 'some_url',
        bbbLogo: 'some_url',
      },
    },
  },
}));

const left = <p>Left content</p>;
const right = <p>Right content</p>;

describe('DashboardClassroomLayout', () => {
  it('renders correctly without right content', () => {
    const { getByText, queryByText } = render(
      <DashboardClassroomLayout left={left} />,
    );

    getByText('Left content');
    const rightContent = queryByText('Right content');
    expect(rightContent).not.toBeInTheDocument();
  });

  it('renders correctly with right content', () => {
    const { getByText } = render(
      <DashboardClassroomLayout left={left} right={right} />,
    );

    getByText('Left content');
    getByText('Right content');
  });
});
