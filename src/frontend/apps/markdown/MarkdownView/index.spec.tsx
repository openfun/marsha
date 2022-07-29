import { screen } from '@testing-library/react';
import { useJwt } from 'data/stores/useJwt';
import React from 'react';

import { OrganizationAccessRole } from 'types/User';
import render from 'utils/tests/render';

import MarkdownView from '.';

let mockCanUpdate: boolean;
let mockRole: OrganizationAccessRole;

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    modelName: 'markdown_documents',
  }),
}));

jest.mock('apps/markdown/MarkdownEditor', () => () => <p>MarkdownEditor</p>);
jest.mock('apps/markdown/MarkdownViewer', () => () => <p>MarkdownViewer</p>);

describe('<MarkdownView />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () => {
        return {
          permissions: {
            can_update: mockCanUpdate,
          },
          roles: [mockRole],
          consumer_site: 'consumer_site',
        } as any;
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows editor for instructor', async () => {
    mockCanUpdate = true;
    mockRole = OrganizationAccessRole.INSTRUCTOR;

    render(<MarkdownView />);

    await screen.findByText('MarkdownEditor');
    expect(screen.queryByText('MarkdownViewer')).not.toBeInTheDocument();
  });

  it('shows viewer for instructor without editing permission', async () => {
    mockCanUpdate = false;
    mockRole = OrganizationAccessRole.INSTRUCTOR;

    render(<MarkdownView />);

    await screen.findByText('MarkdownViewer');
    expect(screen.queryByText('MarkdownEditor')).not.toBeInTheDocument();
  });

  it('shows viewer for student', async () => {
    mockCanUpdate = true; // or false
    mockRole = OrganizationAccessRole.STUDENT;

    render(<MarkdownView />);

    await screen.findByText('MarkdownViewer');
    expect(screen.queryByText('MarkdownEditor')).not.toBeInTheDocument();
  });

  it('shows not found for student if still draft', async () => {
    mockCanUpdate = false;
    mockRole = OrganizationAccessRole.STUDENT;
    useJwt.setState({
      getDecodedJwt: () => {
        throw new Error('failed');
      },
    });

    render(<MarkdownView />);

    await screen.findByText('Resource not found');
    await screen.findByText(
      'The resource you are looking for is not available. If you are an instructor try to re-authenticate.',
    );

    expect(screen.queryByText('MarkdownEditor')).not.toBeInTheDocument();
    expect(screen.queryByText('MarkdownViewer')).not.toBeInTheDocument();
  });
});
