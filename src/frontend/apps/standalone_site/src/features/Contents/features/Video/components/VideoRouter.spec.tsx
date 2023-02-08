import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import VideoRouter from './VideoRouter';

jest.mock('./Read/Videos', () => ({
  __esModule: true,
  default: () => <div>My VideosRead</div>,
}));

describe('<VideoRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-contents/videos', () => {
    render(<VideoRouter />, {
      routerOptions: { history: ['/my-contents/videos'] },
    });
    expect(screen.getByText('My VideosRead')).toBeInTheDocument();
  });
});
