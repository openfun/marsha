import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { DashboardClassroomLayout } from './index';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        bbbBackground: 'some_url',
        bbbLogo: 'some_url',
      },
    },
  }),
}));

const left = <p>Left content</p>;
const right = <p>Right content</p>;

describe('DashboardClassroomLayout', () => {
  it('renders correctly without right content', () => {
    render(<DashboardClassroomLayout left={left} />);

    screen.getByText('Left content');
    const rightContent = screen.queryByText('Right content');
    expect(rightContent).not.toBeInTheDocument();
  });

  it('renders correctly with right content', () => {
    render(<DashboardClassroomLayout left={left} right={right} />);

    expect(screen.getByText('Left content')).toBeInTheDocument();
    expect(screen.getByText('Right content')).toBeInTheDocument();
  });
});
