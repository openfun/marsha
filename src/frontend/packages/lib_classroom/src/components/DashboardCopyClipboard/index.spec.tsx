import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCurrentResourceContext } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import DashboardCopyClipboard from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResource =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

// Even if its depreciated, it's what is used under-the-hood in the clipboard.js librairy
document.execCommand = jest.fn();

global.window = Object.create(window);
const url = 'http://dummy.com';
Object.defineProperty(window, 'location', {
  value: {
    href: url,
  },
  writable: true,
});

describe('<DashboardCopyClipboard />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('checks the renders and interaction', () => {
    mockedUseCurrentResource.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);

    render(<DashboardCopyClipboard inviteToken="my-token" classroomId="1" />);

    const copyButton = screen.getByRole('button', {
      name: 'Invite someone with this link:',
    });

    expect(
      screen.getByText('Invite someone with this link:'),
    ).toBeInTheDocument();
    expect(copyButton).toBeInTheDocument();
    expect(
      screen.getByText('http://dummy.com/invite/my-token'),
    ).toBeInTheDocument();

    expect(document.execCommand).toHaveBeenCalledTimes(0);
    userEvent.click(copyButton);
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(screen.getByText('Url copied in clipboard !')).toBeInTheDocument();
  });

  it('checks with isFromWebsite false', () => {
    mockedUseCurrentResource.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);

    render(<DashboardCopyClipboard inviteToken="my-token" classroomId="1" />);

    expect(
      screen.queryByText('Invite someone with this link:'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('LTI link for this classroom:'),
    ).not.toBeInTheDocument();
  });
});
