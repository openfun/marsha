import { screen, act } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';

import HomePage from './HomePage';

jest.mock('features/Contents', () => ({
  useContentRoutes: () => ({
    CONTENTS: {
      path: '/contents',
    },
  }),
  ContentsShuffle: () => <div>My ContentsShuffle</div>,
}));

describe('<HomePage />', () => {
  test('renders HomePage', async () => {
    render(<HomePage />);
    expect(screen.getByText(/My ContentsShuffle/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '› See Everything' }),
    ).toBeInTheDocument();

    const imageRef = screen.getByAltText('Homepage Banner');
    act(() => {
      ReactTestUtils.Simulate.load(imageRef);
    });

    expect(await screen.findByText(/Learn freely/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Online courses to discover, learn, progress and succeed/i,
      ),
    ).toBeInTheDocument();
  });
});
