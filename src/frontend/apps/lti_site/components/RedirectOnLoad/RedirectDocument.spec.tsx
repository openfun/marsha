import { screen } from '@testing-library/react';
import {
  FULL_SCREEN_ERROR_ROUTE,
  WithParams,
  builderDashboardRoute,
  modelName,
  useCurrentResourceContext,
} from 'lib-components';
import { documentMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import { builderPlayerRoute } from 'components/routes';

import { RedirectDocument } from './RedirectDocument';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseCurrentResource =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('RedirectDocument', () => {
  beforeEach(() => jest.resetAllMocks());

  it('redirects to the player when the document is ready to show', () => {
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: undefined } },
    ] as any);
    const document = documentMockFactory({
      is_ready_to_show: true,
    });

    render(<RedirectDocument document={document} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.DOCUMENTS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.DOCUMENTS),
            element: <span>document player</span>,
          },
        ],
      },
    });

    expect(screen.getByText('document player')).toBeInTheDocument();
  });

  it('redirects to the dashboard when the user has update permission and the document is not ready to show', () => {
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: true } },
    ] as any);
    const document = documentMockFactory({
      is_ready_to_show: false,
    });

    render(<RedirectDocument document={document} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.DOCUMENTS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.DOCUMENTS),
            element: <span>document player</span>,
          },
        ],
      },
    });

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('redirects to the error view when the user has no update permission and the document is not ready to show', () => {
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: false } },
    ] as any);
    const document = documentMockFactory({
      is_ready_to_show: false,
    });

    render(<RedirectDocument document={document} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.DOCUMENTS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.DOCUMENTS),
            element: <span>document player</span>,
          },
        ],
      },
    });

    expect(screen.getByText('Error Component: notFound')).toBeInTheDocument();
  });
});
