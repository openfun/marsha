import { screen } from '@testing-library/react';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { useSetDisplayName } from 'data/stores/useSetDisplayName';
import { wrapInIntlProvider } from 'utils/tests/intl';
import render from 'utils/tests/render';

import { DisplayNameForm } from '.';

jest.mock('data/stores/useSetDisplayName', () => ({
  useSetDisplayName: jest.fn(),
}));
const mockedUseSetDisplayName = useSetDisplayName as jest.MockedFunction<
  typeof useSetDisplayName
>;

describe('<DisplayNameForm />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () => ({ user: {} } as any),
    });
  });

  it('does not render the layer', () => {
    mockedUseSetDisplayName.mockReturnValue([false, jest.fn()]);

    const { elementContainer: container } = render(<DisplayNameForm />);

    expect(container!.children.length).toEqual(0);
  });

  it('renders the layer', () => {
    mockedUseSetDisplayName.mockReturnValue([true, jest.fn()]);

    render(wrapInIntlProvider(<DisplayNameForm />));

    screen.getByRole('textbox');
    screen.getByRole('button');
    screen.getByText('Display name');
  });
});
