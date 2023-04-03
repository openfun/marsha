import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import DashboardCopyClipboard from '.';

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

  it('should display invite and lti links in standalone site context', async () => {
    render(
      <DashboardCopyClipboard
        inviteToken="my-token"
        instructorToken="my-instructor-token"
        classroomId="1"
      />,
    );

    const copyInviteButton = screen.getByRole('button', {
      name: 'Invite a viewer with this link:',
    });

    const copyInstructorButton = screen.getByRole('button', {
      name: 'Invite a moderator with this link:',
    });

    const copyLtiLinkButton = screen.getByRole('button', {
      name: 'LTI link for this classroom:',
    });

    expect(
      screen.getByText('Invite a viewer with this link:'),
    ).toBeInTheDocument();
    expect(copyInviteButton).toBeInTheDocument();
    expect(
      screen.getByText(
        'http://dummy.com/my-contents/classroom/1/invite/my-token',
      ),
    ).toBeInTheDocument();

    expect(copyInstructorButton).toBeInTheDocument();
    expect(
      screen.getByText(
        'http://dummy.com/my-contents/classroom/1/invite/my-instructor-token',
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
    await waitForElementToBeRemoved(
      () => screen.queryByText('Url copied in clipboard !'),
      { timeout: 5000 },
    );

    userEvent.click(copyInstructorButton);
    expect(document.execCommand).toHaveBeenCalledTimes(2);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(screen.getByText('Url copied in clipboard !')).toBeInTheDocument();

    userEvent.click(copyLtiLinkButton);
    expect(document.execCommand).toHaveBeenCalledTimes(3);
    expect(document.execCommand).toHaveBeenLastCalledWith('copy');
  }, 10000);

  it('should not display invite links if no invite tokens', () => {
    render(<DashboardCopyClipboard classroomId="1" />);

    expect(
      screen.queryByText('Invite a viewer with this link:'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'http://dummy.com/my-contents/classroom/1/invite/my-token',
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText('Invite a moderator with this link:'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'http://dummy.com/my-contents/classroom/1/invite/my-instructor-token',
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
