import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import VideoContents from './VideoContents';

jest.mock('./Videos', () => ({
  __esModule: true,
  default: () => <div>Videos Component</div>,
}));

describe('<VideoContents />', () => {
  test('renders VideoContents', () => {
    render(<VideoContents />);
    expect(screen.getByText(/My Videos/)).toBeInTheDocument();
    expect(screen.getByText(/Videos Component/i)).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toBeInTheDocument();
  });
});
