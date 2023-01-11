import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Nullable } from 'lib-common';
import {
  useCurrentUser,
  useMaintenance,
  liveState,
  liveSessionFactory,
  videoMockFactory,
  LiveModeType,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { setLiveSessionDisplayName } from 'api/setLiveSessionDisplayName';
import { converse } from 'utils/window';
import { wrapInVideo } from 'utils/wrapInVideo';

import { StudentLiveWaitingRoom } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'videos',
    resource: {
      id: '1',
    },
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  useCurrentResourceContext: () => [
    {
      context_id: 'context_id',
      consumer_site: 'a.site.fr',
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'ressource_id',
      roles: [],
      session_id: 'session_id',
    },
  ],
  decodeJwt: () => ({}),
}));

jest.mock('api/setLiveSessionDisplayName', () => ({
  setLiveSessionDisplayName: jest.fn(),
}));

jest.mock('utils/window', () => ({
  converse: {
    claimNewNicknameInChatRoom: jest.fn(),
  },
}));

const mockConverse = converse.claimNewNicknameInChatRoom as jest.MockedFunction<
  typeof converse.claimNewNicknameInChatRoom
>;
const mockSetLiveSessionDisplayName =
  setLiveSessionDisplayName as jest.MockedFunction<
    typeof setLiveSessionDisplayName
  >;

describe('<StudentLiveWaitingRoom />', () => {
  beforeEach(() => {
    useMaintenance.setState({
      isActive: false,
    });

    useCurrentUser.setState({
      currentUser: {
        id: 'user_id',
        username: 'username',
        full_name: 'hisName',
        email: 'test@openfun.fr',
      } as any,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the waiting room', () => {
    const video = videoMockFactory({
      title: 'live title',
      description: 'live description',
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });

    render(wrapInVideo(<StudentLiveWaitingRoom />, video));

    expect(screen.getByText('Live has started')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You will join the discussion after you entered your name.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'live title' }),
    ).toBeInTheDocument();
    expect(screen.getByText('live description')).toBeInTheDocument();
  });

  it('sets the display name', async () => {
    mockConverse.mockImplementation(
      (
        _displayName: string,
        callbackSuccess: () => void,
        _callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        callbackSuccess();
      },
    );
    const video = videoMockFactory({
      title: 'live title',
      description: 'live description',
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });

    render(wrapInVideo(<StudentLiveWaitingRoom />, video));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.clear(inputTextbox);
    userEvent.type(inputTextbox, 'John_Doe');

    userEvent.click(validateButton);

    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
  });
});
