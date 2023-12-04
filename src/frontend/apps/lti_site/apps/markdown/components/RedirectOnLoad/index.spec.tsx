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
  MARKDOWN_EDITOR_ROUTE,
  MARKDOWN_NOT_FOUND_ROUTE,
  MARKDOWN_VIEWER_ROUTE,
} from 'lib-markdown';
import {
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
} from 'lib-markdown/tests';
import { render } from 'lib-tests';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { MARKDOWN_WIZARD_ROUTE } from '../MarkdownWizard/route';

import { RedirectOnLoad } from '.';

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
    mockedUseCurrentResourceContext.mockReturnValue([] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
        ],
      },
    });

    expect(screen.getByText('Error Component: lti')).toBeInTheDocument();
  });

  it('shows not found when feature is disabled', () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: false },
    } as any);
    mockedUseCurrentResourceContext.mockReturnValue([] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: MARKDOWN_NOT_FOUND_ROUTE(),
            element: <span>Feature disabled</span>,
          },
        ],
      },
    });

    expect(screen.getByText('Feature disabled')).toBeInTheDocument();
  });

  it('shows editor for instructor who can update an existing document', () => {
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

    expect(screen.getByText('Markdown editor')).toBeInTheDocument();
  });

  it('shows wizard for instructor who can update a document without translation', () => {
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
    expect(screen.getByText('Markdown wizard')).toBeInTheDocument();
  });

  it('shows wizard for instructor who can update a document which translation has no title', () => {
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
    expect(screen.getByText('Markdown wizard')).toBeInTheDocument();
  });

  it('shows editor for instructor who can update a document if a translation has a title', () => {
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
    expect(screen.getByText('Markdown editor')).toBeInTheDocument();
  });

  it('shows viewer for student or instructor who cannot update', () => {
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

    expect(screen.getByText('Markdown viewer')).toBeInTheDocument();
  });

  it('shows not found for student if still draft', () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
    } as any);
    useJwt.setState({
      jwt: undefined,
    });
    mockedUseCurrentResourceContext.mockReturnValue([] as any);

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

    expect(screen.getByText('Markdown not found')).toBeInTheDocument();
  });

  it('redirects to portability if app state requires it', () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { markdown: true },
      state: appState.PORTABILITY,
    } as any);
    useJwt.setState({
      jwt: undefined,
    });
    mockedUseCurrentResourceContext.mockReturnValue([] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: RESOURCE_PORTABILITY_REQUEST_ROUTE,
            element: <span>Portability request</span>,
          },
        ],
      },
    });

    expect(screen.getByText('Portability request')).toBeInTheDocument();
  });
});
