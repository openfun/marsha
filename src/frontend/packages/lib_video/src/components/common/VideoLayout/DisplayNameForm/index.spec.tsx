/* eslint-disable testing-library/no-node-access */
import { screen } from '@testing-library/react';
import { useJwt, liveMockFactory } from 'lib-components';
import { render, wrapInIntlProvider } from 'lib-tests';
import React from 'react';

import { useSetDisplayName } from '@lib-video/hooks/useSetDisplayName';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { DisplayNameForm } from '.';

jest.mock('hooks/useSetDisplayName', () => ({
  useSetDisplayName: jest.fn(),
}));
const mockedUseSetDisplayName = useSetDisplayName as jest.MockedFunction<
  typeof useSetDisplayName
>;

const live = liveMockFactory({
  id: 'some-live-id',
});

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

    render(wrapInVideo(wrapInIntlProvider(<DisplayNameForm />), live));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Display name')).toBeInTheDocument();
  });
});
