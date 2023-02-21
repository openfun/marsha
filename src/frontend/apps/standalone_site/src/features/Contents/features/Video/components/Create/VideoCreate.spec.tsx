import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import VideoCreate from './VideoCreate';

jest.mock('./VideoCreateForm', () => ({
  __esModule: true,
  default: () => <div>My VideoCreate Form</div>,
}));

describe('<VideoCreate />', () => {
  test('renders VideoCreate', () => {
    render(<VideoCreate />);

    const button = screen.getByRole('button', { name: /Create Video/i });
    expect(button).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Create Video/i }),
    ).not.toBeInTheDocument();

    userEvent.click(button);

    expect(
      screen.getByRole('heading', { name: /Create Video/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('My VideoCreate Form')).toBeInTheDocument();
  });
});
