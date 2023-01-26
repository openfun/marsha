import { screen } from '@testing-library/react';
import { Maybe } from 'lib-common';
import {
  AppConfigProvider,
  appNames,
  appState,
  decodeJwt,
  modelName,
  useCurrentSession,
  useCurrentUser,
  useJwt,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { IntlShape, useIntl } from 'react-intl';

import AppContentLoader from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  decodeJwt: jest.fn(),
}));
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;

let intl: Maybe<IntlShape>;
const MockContent = () => {
  intl = useIntl();

  return <span>content</span>;
};
jest.mock('apps/classroom/components/Routes', () => MockContent);

describe('<AppContentLoader />', () => {
  beforeEach(() => {
    useCurrentUser.setState({ currentUser: undefined });
    useCurrentSession.setState({ sessionId: undefined });

    intl = undefined;
  });

  it('initialize current user before loading content', async () => {
    useJwt.setState({ jwt: 'some jwt' });
    mockedDecodeJwt.mockReturnValue({
      session_id: 'some session id',
      user: {
        anonymous_id: 'anonymous id',
        email: 'some email',
        id: 'id',
        username: 'user name',
        user_fullname: 'user full name',
      },
      locale: 'pl',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'resource id',
      roles: [],
    });

    render(
      <AppConfigProvider
        value={{
          appName: appNames.CLASSROOM,
          attendanceDelay: 10,
          state: appState.SUCCESS,
          modelName: modelName.VIDEOS,
          sentry_dsn: 'test.dns.com',
          environment: 'tests',
          frontend: 'test-frontend',
          release: 'debug',
          static: {
            svg: {
              icons: '',
            },
            img: {
              liveBackground: '',
              liveErrorBackground: '',
              marshaWhiteLogo: '',
              videoWizardBackground: '',
              errorMain: '',
            },
          },
          uploadPollInterval: 10,
        }}
      >
        <AppContentLoader />
      </AppConfigProvider>,
    );

    await screen.findByText('content');

    expect(decodeJwt).toHaveBeenCalledTimes(1);
    expect(useCurrentSession.getState()).toEqual({
      sessionId: 'some session id',
    });
    expect(useCurrentUser.getState().currentUser).toEqual({
      anonymous_id: 'anonymous id',
      email: 'some email',
      id: 'id',
      username: 'user name',
      full_name: 'user full name',
      is_staff: false,
      is_superuser: false,
      organization_accesses: [],
    });

    expect(intl?.locale).toEqual('pl');
  });
});
