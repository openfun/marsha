import React from 'react';

import { OrganizationAccessRole, useJwt } from 'lib-components';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { useAppConfig } from 'data/stores/useAppConfig';
import { appState } from 'types/AppData';
import render from 'utils/tests/render';

import { RedirectOnLoad } from '.';
import { MARKDOWN_NOT_FOUND_ROUTE } from '../MarkdownNotFoundView/route';
import { MARKDOWN_VIEWER_ROUTE } from '../MarkdownViewer/route';
import { MARKDOWN_EDITOR_ROUTE } from '../MarkdownEditor/route';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;
const mockedGetDecodedJwt = jest.fn();

describe('<RedirectOnLoad />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some-jwt',
      getDecodedJwt: mockedGetDecodedJwt,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('redirects users to the error view on LTI error', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.ERROR,
      flags: { markdown: true },
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
          },
        ],
      },
    });

    getByText('Error Component: lti');
  });

  it('shows not found when feature is disabled', () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: false },
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_NOT_FOUND_ROUTE(),
            render: () => <span>Feature disabled</span>,
          },
        ],
      },
    });

    getByText('Feature disabled');
  });

  it('shows editor for instructor', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    mockedGetDecodedJwt.mockReturnValue({
      permissions: {
        can_update: true,
      },
      roles: [OrganizationAccessRole.INSTRUCTOR],
      consumer_site: 'consumer_site',
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_EDITOR_ROUTE(),
            render: () => <span>Markdown editor</span>,
          },
        ],
      },
    });

    getByText('Markdown editor');
  });

  it('shows viewer for instructor without editing permission', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    mockedGetDecodedJwt.mockReturnValue({
      permissions: {
        can_update: false,
      },
      roles: [OrganizationAccessRole.INSTRUCTOR],
      consumer_site: 'consumer_site',
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_VIEWER_ROUTE(),
            render: () => <span>Markdown viewer</span>,
          },
        ],
      },
    });

    getByText('Markdown viewer');
  });

  it('shows viewer for student', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    mockedGetDecodedJwt.mockReturnValue({
      permissions: {
        can_update: true, // or false
      },
      roles: [OrganizationAccessRole.STUDENT],
      consumer_site: 'consumer_site',
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_VIEWER_ROUTE(),
            render: () => <span>Markdown viewer</span>,
          },
        ],
      },
    });

    getByText('Markdown viewer');
  });

  it('shows not found for student if still draft', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    useJwt.setState({
      jwt: undefined,
    });

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_NOT_FOUND_ROUTE(),
            render: () => <span>Markdown not found</span>,
          },
        ],
      },
    });

    getByText('Markdown not found');
  });
});
