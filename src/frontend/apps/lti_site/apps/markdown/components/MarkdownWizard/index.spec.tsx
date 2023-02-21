import { screen, waitFor } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';
import {
  MARKDOWN_EDITOR_ROUTE,
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
} from 'lib-markdown';
import fetchMock from 'fetch-mock';

import { MarkdownWizard } from '.';
import { useJwt } from 'lib-components';
import userEvent from '@testing-library/user-event';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  WizardLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAppConfig: jest.fn(),
}));

describe('MarkdownWizard', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'en_US' } as any),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('creates an empty translation in current language', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [],
    });

    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      {
        ...markdownDocument,
        translations: [markdownTranslationMockFactory({ language_code: 'en' })],
      },
      {
        body: {
          language_code: 'en',
          title: 'My title',
          content: '',
          rendered_content: '',
        },
      },
    );
    render(<MarkdownWizard markdownDocumentId={markdownDocument.id} />);
    expect(screen.getByText('Start by naming your course')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', {
      name: 'Create your course',
    });
    expect(saveButton).toBeDisabled();

    userEvent.type(
      screen.getByRole('textbox', { name: 'Enter title of your course here' }),
      'My title',
    );
    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);
    await waitFor(() =>
      expect(mockHistoryPush).toHaveBeenCalledWith(MARKDOWN_EDITOR_ROUTE()),
    );
  });

  it('creates an empty translation in fr', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [],
    });

    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      {
        ...markdownDocument,
        translations: [markdownTranslationMockFactory({ language_code: 'fr' })],
      },
      {
        body: {
          language_code: 'fr',
          title: 'Mon titre',
          content: '',
          rendered_content: '',
        },
      },
    );
    render(<MarkdownWizard markdownDocumentId={markdownDocument.id} />);
    const saveButton = screen.getByRole('button', {
      name: 'Create your course',
    });

    userEvent.type(
      screen.getByRole('textbox', { name: 'Enter title of your course here' }),
      'Mon titre',
    );
    userEvent.click(screen.getByRole('button', { name: /Select language/i }));
    userEvent.click(await screen.findByRole('option', { name: /French/i }));
    userEvent.click(saveButton);
  });
});
