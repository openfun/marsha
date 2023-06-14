import { screen } from '@testing-library/react';

import {
  FULL_SCREEN_ERROR_ROUTE,
  OrganizationAccessRole,
  WithParams,
  appState,
  useAppConfig,
  useCurrentResourceContext,
  useJwt,
} from 'lib-components';
import {
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
} from 'lib-markdown';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';
import { render } from 'lib-tests';

import {
  MARKDOWN_EDITOR_ROUTE,
  MARKDOWN_NOT_FOUND_ROUTE,
  MARKDOWN_VIEWER_ROUTE,
} from 'lib-markdown';
import { RedirectOnLoad } from '.';
import { MARKDOWN_WIZARD_ROUTE } from '../MarkdownWizard/route';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<RedirectOnLoad />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
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
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code}`}</span>}
              </WithParams>
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
            element: <span>Feature disabled</span>,
          },
        ],
      },
    });

    getByText('Feature disabled');
  });

  it('shows editor for instructor who can update an existing document', async () => {
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
            element: <span>Markdown editor</span>,
          },
        ],
      },
    });

    screen.getByText('Markdown editor');
  });

  it('shows wizard for instructor who can update a document without translation', async () => {
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
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      translations: [],
    });

    render(<RedirectOnLoad markdownDocument={markdownDocument} />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_WIZARD_ROUTE(),
            element: <span>Markdown wizard</span>,
          },
        ],
      },
    });
    screen.getByText('Markdown wizard');
  });

  it('shows wizard for instructor who can update a document which translation has no title', async () => {
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
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      translations: [
        markdownTranslationMockFactory({
          language_code: 'en',
          title: '',
          rendered_content: '<p>English document content.</p>',
        }),
      ],
    });

    render(<RedirectOnLoad markdownDocument={markdownDocument} />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_WIZARD_ROUTE(),
            element: <span>Markdown wizard</span>,
          },
        ],
      },
    });
    screen.getByText('Markdown wizard');
  });

  it('shows editor for instructor who can update a document if a translation has a title', async () => {
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
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      translations: [
        markdownTranslationMockFactory({
          language_code: 'en',
          title: '',
          rendered_content: '<p>English document content.</p>',
        }),
        markdownTranslationMockFactory({
          language_code: 'fr',
          title: 'Un titre en français',
          rendered_content: '<p>Contenu en français.</p>',
        }),
      ],
    });

    render(<RedirectOnLoad markdownDocument={markdownDocument} />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_EDITOR_ROUTE(),
            element: <span>Markdown editor</span>,
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
            element: <span>Markdown viewer</span>,
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
            element: <span>Markdown not found</span>,
          },
        ],
      },
    });

    screen.getByText('Markdown not found');
  });

  it('redirects to portability if app state requires it', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
      state: appState.PORTABILITY,
    } as any);
    useJwt.setState({
      jwt: undefined,
    });

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: RESOURCE_PORTABILITY_REQUEST_ROUTE,
            element: <span>Portability request</span>,
          },
        ],
      },
    });

    getByText('Portability request');
  });
});
