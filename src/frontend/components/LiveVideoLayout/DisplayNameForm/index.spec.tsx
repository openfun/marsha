import { render, screen } from '@testing-library/react';
import { useSetDisplayName } from 'data/stores/useSetDisplayName';
import React from 'react';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { DisplayNameForm } from '.';

jest.mock('data/stores/useSetDisplayName', () => ({
  useSetDisplayName: jest.fn(),
}));
const mockedUseSetDisplayName = useSetDisplayName as jest.MockedFunction<
  typeof useSetDisplayName
>;

jest.mock('data/appData', () => ({
  getDecodedJwt: () => ({
    user: {},
  }),
}));

describe('<DisplayNameForm />', () => {
  it('does not render the layer', () => {
    mockedUseSetDisplayName.mockReturnValue([false, jest.fn()]);

    const { container } = render(<DisplayNameForm />);

    expect(container.children.length).toEqual(0);
  });

  it('renders the layer', () => {
    mockedUseSetDisplayName.mockReturnValue([true, jest.fn()]);

    render(wrapInIntlProvider(<DisplayNameForm />));

    screen.getByRole('textbox');
    screen.getByRole('button');
    screen.getByText('Display name');
  });
});
