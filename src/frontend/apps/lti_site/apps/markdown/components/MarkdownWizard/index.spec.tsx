import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { MARKDOWN_EDITOR_ROUTE } from 'lib-markdown';
import {
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
} from 'lib-markdown/tests';
import { render } from 'lib-tests';
import React from 'react';

import { MarkdownWizard } from '.';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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
      getDecodedJwt: () => ({ locale: 'en_US' }) as any,
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

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Enter title of your course here' }),
      'My title',
    );
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(MARKDOWN_EDITOR_ROUTE()),
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

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Enter title of your course here' }),
      'Mon titre',
    );
    await userEvent.click(
      screen.getByRole('combobox', { name: /Select language/i }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: /French/i }),
    );
    await userEvent.click(saveButton);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(MARKDOWN_EDITOR_ROUTE()),
    );
  });
});
