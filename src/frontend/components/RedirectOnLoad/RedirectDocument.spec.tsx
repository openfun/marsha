import { render, screen } from '@testing-library/react';
import React from 'react';

import { documentMockFactory } from '../../utils/tests/factories';
import { wrapInRouter } from '../../utils/tests/router';
import { modelName } from '../../types/models';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { PLAYER_ROUTE } from '../routes';
import { RedirectDocument } from './RedirectDocument';

let mockCanUpdate: boolean;
jest.mock('../../data/appData', () => ({
  getDecodedJwt: () => ({
    permissions: {
      can_update: mockCanUpdate,
    },
  }),
}));

describe('RedirectDocument', () => {
  beforeEach(() => jest.resetAllMocks());

  it('redirects to the player when the document is ready to show', () => {
    const document = documentMockFactory({
      is_ready_to_show: true,
    });

    render(
      wrapInRouter(<RedirectDocument document={document} />, [
        {
          path: DASHBOARD_ROUTE(modelName.DOCUMENTS),
          element: <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          element: <span>{`Error Component`}</span>,
        },
        {
          path: PLAYER_ROUTE(modelName.DOCUMENTS),
          element: <span>document player</span>,
        },
      ]),
    );

    screen.getByText('document player');
  });

  it('redirects to the dashboard when the user has update permission and the document is not ready to show', () => {
    mockCanUpdate = true;
    const document = documentMockFactory({
      is_ready_to_show: false,
    });

    render(
      wrapInRouter(<RedirectDocument document={document} />, [
        {
          path: DASHBOARD_ROUTE(modelName.DOCUMENTS),
          element: <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          element: <span>{`Error Component`}</span>,
        },
        {
          path: PLAYER_ROUTE(modelName.DOCUMENTS),
          element: <span>document player</span>,
        },
      ]),
    );

    screen.getByText('dashboard');
  });

  it('redirects to the error view when the user has no update permission and the document is not ready to show', () => {
    mockCanUpdate = false;
    const document = documentMockFactory({
      is_ready_to_show: false,
    });

    render(
      wrapInRouter(<RedirectDocument document={document} />, [
        {
          path: DASHBOARD_ROUTE(modelName.DOCUMENTS),
          element: <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE('notFound'),
          element: <span>{`Error Component: notFound`}</span>,
        },
        {
          path: PLAYER_ROUTE(modelName.DOCUMENTS),
          element: <span>document player</span>,
        },
      ]),
    );

    screen.getByText('Error Component: notFound');
  });
});
