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
    origin: url,
  },
  writable: true,
});

describe('<DashboardCopyClipboard />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should display invite and lti links in standalone site context', () => {
    mockedUseCurrentResource.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);

    render(<DashboardCopyClipboard inviteToken="my-token" classroomId="1" />);

    const copyInviteButton = screen.getByRole('button', {
      name: 'Invite someone with this link:',
    });

    const copyLtiLinkButton = screen.getByRole('button', {
      name: 'LTI link for this classroom:',
    });

    expect(
      screen.getByText('Invite someone with this link:'),
    ).toBeInTheDocument();
    expect(copyInviteButton).toBeInTheDocument();
    expect(
      screen.getByText(
        'http://dummy.com/my-contents/classroom/1/invite/my-token',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('LTI link for this classroom:'),
    ).toBeInTheDocument();
    expect(copyLtiLinkButton).toBeInTheDocument();
    expect(
      screen.getByText('http://dummy.com/lti/classrooms/1'),
    ).toBeInTheDocument();

    expect(document.execCommand).toHaveBeenCalledTimes(0);
    userEvent.click(copyInviteButton);
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(screen.getByText('Url copied in clipboard !')).toBeInTheDocument();

    userEvent.click(copyLtiLinkButton);
    expect(document.execCommand).toHaveBeenCalledTimes(2);
    expect(document.execCommand).toHaveBeenLastCalledWith('copy');
  });

  it('should only display invite link in lti context', () => {
    mockedUseCurrentResource.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);

    render(<DashboardCopyClipboard inviteToken="my-token" classroomId="1" />);

    expect(
      screen.getByText('Invite someone with this link:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'http://dummy.com/my-contents/classroom/1/invite/my-token',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('LTI link for this classroom:'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('http://dummy.com/lti/classrooms/1'),
    ).not.toBeInTheDocument();
  });

  it('should not display invite link if no invite token', () => {
    mockedUseCurrentResource.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);

    render(<DashboardCopyClipboard inviteToken="" classroomId="1" />);

    expect(
      screen.queryByText('Invite someone with this link:'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'http://dummy.com/my-contents/classroom/1/invite/my-token',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('LTI link for this classroom:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('http://dummy.com/lti/classrooms/1'),
    ).toBeInTheDocument();
  });
});
