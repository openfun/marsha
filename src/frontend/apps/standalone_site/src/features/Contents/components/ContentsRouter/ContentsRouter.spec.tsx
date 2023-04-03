import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ContentsRouter from './ContentsRouter';

jest.mock('../Contents/Contents', () => ({
  __esModule: true,
  default: () => <div>My Contents</div>,
}));

jest.mock('features/Contents', () => ({
  ClassRoomRouter: () => <div>My ClassRoomRouter</div>,
  VideoRouter: () => <div>My VideoRouter</div>,
  LiveRouter: () => <div>My LiveRouter</div>,
}));

describe('<ContentsRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-contents', () => {
    render(<ContentsRouter />, {
      routerOptions: { history: ['/my-contents'] },
    });
    expect(screen.getByText('My Contents')).toBeInTheDocument();
  });

  test('render route /my-contents/classroom', () => {
    render(<ContentsRouter />, {
      routerOptions: { history: ['/my-contents/classroom'] },
    });
    expect(screen.getByText('My ClassRoomRouter')).toBeInTheDocument();
  });

  test('render route /my-contents/videos', () => {
    render(<ContentsRouter />, {
      routerOptions: { history: ['/my-contents/videos'] },
    });
    expect(screen.getByText('My VideoRouter')).toBeInTheDocument();
  });

  test('render route /my-contents/lives', () => {
    render(<ContentsRouter />, {
      routerOptions: { history: ['/my-contents/lives'] },
    });
    expect(screen.getByText('My LiveRouter')).toBeInTheDocument();
  });
});
