import { screen } from '@testing-library/react';
import { useCurrentResourceContext } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { classroomInfosMockFactory } from 'utils/tests/factories';

import DashboardClassroomInfos from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResource =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<DashboardClassroomInfos />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays the content for classroom infos', () => {
    const classroomInfos = classroomInfosMockFactory();
    render(
      <DashboardClassroomInfos inviteToken={null} infos={classroomInfos} />,
    );

    expect(screen.getByText('Moderators')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Listeners')).toBeInTheDocument();
    expect(screen.getByText(classroomInfos.moderatorCount)).toBeInTheDocument();
    expect(
      screen.getByText(classroomInfos.voiceParticipantCount),
    ).toBeInTheDocument();
    expect(screen.getByText(classroomInfos.listenerCount)).toBeInTheDocument();
    expect(
      screen.queryByText('Invite someone with this link:'),
    ).not.toBeInTheDocument();
  });

  it('displays invite link', () => {
    mockedUseCurrentResource.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);
    render(<DashboardClassroomInfos inviteToken="my-token" />);

    expect(
      screen.getByText('Invite someone with this link:'),
    ).toBeInTheDocument();

    expect(screen.getByText(/invite\/my-token/i)).toBeInTheDocument();
  });
});
