import { render } from '@testing-library/react';
import React from 'react';

import { DashboardMeetingLayout } from './index';

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

describe('DashboardMeetingLayout', () => {
  it('renders correctly without right content', () => {
    const { getByText, queryByText } = render(
      <DashboardMeetingLayout left={left} />,
    );

    getByText('Left content');
    const rightContent = queryByText('Right content');
    expect(rightContent).not.toBeInTheDocument();
  });
  it('renders correctly with right content', () => {
    const { getByText } = render(
      <DashboardMeetingLayout left={left} right={right} />,
    );

    getByText('Left content');
    getByText('Right content');
  });
});
