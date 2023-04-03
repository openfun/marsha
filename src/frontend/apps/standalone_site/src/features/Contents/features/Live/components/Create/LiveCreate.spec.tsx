import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import LiveCreate from './LiveCreate';

jest.mock('./LiveCreateForm', () => ({
  __esModule: true,
  default: () => <div>My WebinarCreate Form</div>,
}));

describe('<LiveCreate />', () => {
  test('renders LiveCreate', () => {
    render(<LiveCreate />);

    const button = screen.getByRole('button', { name: /Create Webinar/i });
    expect(button).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Create Webinar/i }),
    ).not.toBeInTheDocument();

    userEvent.click(button);

    expect(
      screen.getByRole('heading', { name: /Create Webinar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('My WebinarCreate Form')).toBeInTheDocument();
  });
});
