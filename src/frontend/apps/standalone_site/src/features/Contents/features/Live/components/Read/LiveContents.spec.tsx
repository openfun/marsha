import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import LiveContents from './LiveContents';

jest.mock('./Lives', () => ({
  __esModule: true,
  default: () => <div>Webinars Component</div>,
}));

describe('<LiveContents />', () => {
  test('renders LiveContents', () => {
    render(<LiveContents />);
    expect(screen.getByText(/My Webinars/)).toBeInTheDocument();
    expect(screen.getByText(/Webinars Component/i)).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toBeInTheDocument();
  });
});
