import { screen } from '@testing-library/react';
import React from 'react';

import {
  OrganizationAccessRole,
  useCurrentResourceContext,
  useJwt,
} from 'lib-components';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { useAppConfig } from 'lib-components';
import { appState } from 'lib-components';
import render from 'utils/tests/render';

import { RedirectOnLoad } from '.';
import { MARKDOWN_NOT_FOUND_ROUTE } from '../MarkdownNotFoundView/route';
import { MARKDOWN_VIEWER_ROUTE } from '../MarkdownViewer/route';
import { MARKDOWN_EDITOR_ROUTE } from '../MarkdownEditor/route';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<RedirectOnLoad />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it('shows editor for instructor who can update', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: true,
        },
        roles: [OrganizationAccessRole.INSTRUCTOR],
        consumer_site: 'consumer_site',
      },
    ] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_EDITOR_ROUTE(),
            render: () => <span>Markdown editor</span>,
          },
        ],
      },
    });

    screen.getByText('Markdown editor');
  });

  it('shows viewer for student or instructor who cannot update', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
        roles: [OrganizationAccessRole.STUDENT],
        consumer_site: 'consumer_site',
      },
    ] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_VIEWER_ROUTE(),
            render: () => <span>Markdown viewer</span>,
          },
        ],
      },
    });

    screen.getByText('Markdown viewer');
  });

  it('shows not found for student if still draft', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    useJwt.setState({
      jwt: undefined,
    });

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_NOT_FOUND_ROUTE(),
            render: () => <span>Markdown not found</span>,
          },
        ],
      },
    });

    screen.getByText('Markdown not found');
  });
});
