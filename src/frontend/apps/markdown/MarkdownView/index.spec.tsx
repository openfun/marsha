import { render, screen } from '@testing-library/react';
import React from 'react';

import { OrganizationAccessRole } from 'types/User';
import { wrapInIntlProvider } from 'utils/tests/intl';

import MarkdownView from '.';

let mockCanUpdate: boolean;
let mockRole: OrganizationAccessRole;
let mockEnableJwt: boolean;
jest.mock('data/appData', () => ({
  appData: {
    modelName: 'markdown_documents',
  },
  getDecodedJwt: () =>
    mockEnableJwt
      ? {
          permissions: {
            can_update: mockCanUpdate,
          },
          roles: [mockRole],
          consumer_site: 'consumer_site',
        }
      : null,
}));

jest.mock('apps/markdown/MarkdownEditor', () => () => <p>MarkdownEditor</p>);
jest.mock('apps/markdown/MarkdownViewer', () => () => <p>MarkdownViewer</p>);

describe('<MarkdownView />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows editor for instructor', async () => {
    mockCanUpdate = true;
    mockRole = OrganizationAccessRole.INSTRUCTOR;
    mockEnableJwt = true;

    render(wrapInIntlProvider(<MarkdownView />));

    await screen.findByText('MarkdownEditor');
    expect(screen.queryByText('MarkdownViewer')).not.toBeInTheDocument();
  });

  it('shows viewer for instructor without editing permission', async () => {
    mockCanUpdate = false;
    mockRole = OrganizationAccessRole.INSTRUCTOR;
    mockEnableJwt = true;

    render(wrapInIntlProvider(<MarkdownView />));

    await screen.findByText('MarkdownViewer');
    expect(screen.queryByText('MarkdownEditor')).not.toBeInTheDocument();
  });

  it('shows viewer for student', async () => {
    mockCanUpdate = true; // or false
    mockRole = OrganizationAccessRole.STUDENT;
    mockEnableJwt = true;

    render(wrapInIntlProvider(<MarkdownView />));

    await screen.findByText('MarkdownViewer');
    expect(screen.queryByText('MarkdownEditor')).not.toBeInTheDocument();
  });

  it('shows not found for student if still draft', async () => {
    mockCanUpdate = true; // or false
    mockRole = OrganizationAccessRole.STUDENT;
    mockEnableJwt = false;

    render(wrapInIntlProvider(<MarkdownView />));

    await screen.findByText('Resource not found');
    await screen.findByText(
      'The resource you are looking for is not available. If you are an instructor try to re-authenticate.',
    );

    expect(screen.queryByText('MarkdownEditor')).not.toBeInTheDocument();
    expect(screen.queryByText('MarkdownViewer')).not.toBeInTheDocument();
  });
});
