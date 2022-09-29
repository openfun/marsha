import { within } from '@testing-library/dom';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import xhrMock, { MockResponse } from 'xhr-mock';

import { useJwt } from 'lib-components';
import { Deferred } from 'utils/tests/Deferred';
import render from 'utils/tests/render';

import {
  markdownDocumentMockFactory,
  markdownImageMockFactory,
  markdownTranslationMockFactory,
} from 'apps/markdown/utils/tests/factories';

import MarkdownEditor from '.';
import { createDtWithFiles, createFile } from 'utils/tests/reactDropzone';
import { uploadState } from 'types/tracks';
import { UploadManager } from 'components/UploadManager';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    modelName: 'markdown_documents',
    resource: {
      id: '1',
    },
  }),
}));

jest.mock('apps/markdown/data/MarkdownAppData', () => ({
  MarkdownAppData: {
    modelName: 'markdown_documents',
    markdownDocument: {
      id: '1',
    },
  },
}));

jest.mock('apps/markdown/components/MdxRenderer/constants', () => ({
  debouncingTime: 0, // override the debouncing time to make tests twice faster
}));

describe('<MarkdownEditor />', () => {
  // Fix the jsdom for CodeMirror, see https://github.com/jsdom/jsdom/issues/3002
  window.document.createRange = () => {
    const range = new Range();

    range.getBoundingClientRect = jest.fn();

    range.getClientRects = () => {
      return {
        item: () => null,
        length: 0,
        [Symbol.iterator]: jest.fn(),
      };
    };

    return range;
  };

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

  it('shows editor', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [markdownTranslationMockFactory({ language_code: 'en' })],
    });
    const documentDeferred = new Deferred();
    fetchMock.get('/api/markdown-documents/1/', documentDeferred.promise);

    const { container } = render(<MarkdownEditor />);

    act(() => documentDeferred.resolve(markdownDocument));

    await screen.findByDisplayValue(markdownDocument.translations[0].title);
    await waitFor(() =>
      expect(
        screen.getAllByText(markdownDocument.translations[0].content).length,
      ).toEqual(2),
    );
    expect(
      screen.queryByText(
        "💡 You can easily add some content by drag and dropping a text file in one of the editor's line.",
      ),
    ).not.toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Save' });
    const publishButton = screen.getByRole('button', { name: 'Publish' });

    expect(saveButton).not.toBeDisabled();
    expect(publishButton).toBeDisabled();

    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      markdownDocument,
    );
    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/`,
      markdownDocument,
    );
    fetchMock.get(
      `/api/markdown-documents/${markdownDocument.id}/`,
      {
        ...markdownDocument,
        translations: [
          {
            ...markdownDocument.translations[0],
            rendered_content:
              container.querySelectorAll('div.markdown-body')[0].outerHTML,
          },
        ],
      },
      { overwriteRoutes: true },
    );

    act(() => {
      userEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
    expect(publishButton).not.toBeDisabled();

    act(() => {
      userEvent.type(
        screen.getByRole('textbox', { name: 'Title' }),
        ' is changed',
      );
    });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    expect(publishButton).toBeDisabled();
  });

  it('shows editor for new markdown document', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [],
    });
    fetchMock.get('/api/markdown-documents/1/', markdownDocument);

    render(<MarkdownEditor />);

    // Wait for rendered content: all loaders gone
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    );

    expect(screen.getByTestId('renderer_container')).toContainHTML(
      '<div class="markdown-body />',
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');

    screen.getByText(
      "💡 You can easily add some content by drag and dropping a text file in one of the editor's line.",
    );
  });

  it('changes language', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [
        markdownTranslationMockFactory({ language_code: 'en' }),
        markdownTranslationMockFactory({ language_code: 'fr' }),
      ],
    });
    fetchMock.get('/api/markdown-documents/1/', markdownDocument);

    const { container } = render(<MarkdownEditor />);

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getAllByText(markdownDocument.translations[0].content).length, // en translation
      ).toEqual(2),
    );

    // Force save... required to change the language
    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      markdownDocument,
    );
    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/`,
      markdownDocument,
    );
    fetchMock.get(
      `/api/markdown-documents/${markdownDocument.id}/`,
      {
        ...markdownDocument,
        translations: [
          {
            ...markdownDocument.translations[0],
            rendered_content:
              container.querySelectorAll('div.markdown-body')[0].outerHTML,
          },
          { ...markdownDocument.translations[1] },
        ],
      },
      { overwriteRoutes: true },
    );
    act(() => {
      userEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    );

    // Change language to fr
    userEvent.click(screen.getByRole('button', { name: 'English' }));
    act(() => {
      userEvent.click(screen.getByText('French'));
    });

    await waitFor(() =>
      expect(
        screen.getAllByText(markdownDocument.translations[1].content).length, // fr translation
      ).toEqual(2),
    );
  });

  it('changes display', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [markdownTranslationMockFactory({ language_code: 'en' })],
    });
    fetchMock.get('/api/markdown-documents/1/', markdownDocument);

    render(<MarkdownEditor />);

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getAllByText(markdownDocument.translations[0].content).length, // en translation
      ).toEqual(2),
    );

    // Display editor only
    userEvent.click(screen.getByTestId('disposition-editor-only'));
    expect(screen.getByTestId('editor_container')).toBeVisible();
    expect(screen.getByTestId('renderer_container')).not.toBeVisible();

    // Display rendering only
    userEvent.click(screen.getByTestId('disposition-rendering-only'));
    expect(screen.getByTestId('editor_container')).not.toBeVisible();
    expect(screen.getByTestId('renderer_container')).toBeVisible();

    // Display both again
    userEvent.click(screen.getByTestId('disposition-split-screen'));
    expect(screen.getByTestId('editor_container')).toBeVisible();
    expect(screen.getByTestId('renderer_container')).toBeVisible();
  });

  it('enables MDX', async () => {
    // Remove error logs only for this test as React warns about
    // Invalid attribute when MDX is not enabled
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const mdxContent =
      '# MDX\n' +
      '\n' +
      'This paragraph shows what are the advanced uses provided by using *MDX*\n' +
      '\n' +
      "<div style={{padding: '1rem', backgroundColor: 'violet'}} data-testid=\"mdx-rendered-block\">\n" +
      '  Instructor can override the design of the document.\n' +
      '</div>\n' +
      '\n' +
      '\n' +
      'One can define variables:\n' +
      '\n' +
      'export const good_decade = "70th"\n' +
      '\n' +
      'And use it in text like in the {good_decade}';

    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [
        markdownTranslationMockFactory({
          language_code: 'en',
          content: mdxContent,
        }),
      ],
    });
    fetchMock.get('/api/markdown-documents/1/', markdownDocument);

    const { container, rerender } = render(<MarkdownEditor />);

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'MDX' }),
      ).toBeInTheDocument(),
    );

    // Assert the MDX is not rendered properly
    within(screen.getByTestId('renderer_container')).getByText(
      'export const good_decade = "70th"',
    );

    // Enable MDX rendering
    userEvent.click(screen.getByRole('button', { name: 'Settings' })); // open the settings dropdown

    userEvent.click(screen.getByRole('checkbox', { name: 'MDX disabled' }));

    userEvent.click(screen.getByRole('button', { name: 'Settings' })); // close the settings dropdown

    await waitFor(() =>
      expect(
        within(screen.getByTestId('renderer_container')).getByText(
          'And use it in text like in the 70th',
        ),
      ).toBeInTheDocument(),
    );

    within(screen.getByTestId('renderer_container')).getByTestId(
      'mdx-rendered-block',
    );

    const saveButton = await screen.findByRole('button', { name: 'Save' });

    expect(saveButton).not.toBeDisabled();

    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      markdownDocument,
    );
    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/`,
      markdownDocument,
    );
    fetchMock.get(
      `/api/markdown-documents/${markdownDocument.id}/`,
      {
        ...markdownDocument,
        rendering_options: { useMdx: true },
        translations: [
          {
            ...markdownDocument.translations[0],
            rendered_content:
              container.querySelectorAll('div.markdown-body')[0].outerHTML,
          },
        ],
      },
      { overwriteRoutes: true },
    );

    act(() => {
      userEvent.click(saveButton);
    });

    await waitFor(() => expect(saveButton).toBeDisabled());

    expect(fetchMock.calls()[2]![0]).toEqual(
      `/api/markdown-documents/${markdownDocument.id}/`,
    );

    expect(fetchMock.calls()[2]![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        rendering_options: { useMdx: true },
      }),
    });

    rerender(<MarkdownEditor />);

    userEvent.click(screen.getByRole('button', { name: 'Settings' })); // open the settings dropdown

    expect(screen.getByRole('checkbox', { name: 'MDX enabled' })).toBeChecked();
  });

  it('enables Mathjax', async () => {
    const mdxContent = '$ax^2 + bx + c = 0$';

    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [
        markdownTranslationMockFactory({
          language_code: 'en',
          content: mdxContent,
        }),
      ],
    });
    fetchMock.get('/api/markdown-documents/1/', markdownDocument);

    const { container, rerender } = render(<MarkdownEditor />);

    // Wait for rendered content & assert the math are displayed using KaTeX
    await waitFor(() =>
      expect(container.getElementsByClassName('katex-html').length).toBe(1),
    );

    // Enable Mathjax rendering
    userEvent.click(screen.getByRole('button', { name: 'Settings' })); // open the settings dropdown

    userEvent.click(screen.getByRole('checkbox', { name: 'Mathjax disabled' }));

    userEvent.click(screen.getByRole('button', { name: 'Settings' })); // close the settings dropdown

    await waitFor(() =>
      expect(
        within(screen.getByTestId('renderer_container')).getByRole('img')
          .parentNode,
      ).toHaveAttribute('classname', 'MathJax'),
    );

    const saveButton = await screen.findByRole('button', { name: 'Save' });

    expect(saveButton).not.toBeDisabled();

    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      markdownDocument,
    );
    fetchMock.patch(
      `/api/markdown-documents/${markdownDocument.id}/`,
      markdownDocument,
    );
    fetchMock.get(
      `/api/markdown-documents/${markdownDocument.id}/`,
      {
        ...markdownDocument,
        rendering_options: { useMathjax: true },
        translations: [
          {
            ...markdownDocument.translations[0],
            rendered_content:
              container.querySelectorAll('div.markdown-body')[0].outerHTML,
          },
        ],
      },
      { overwriteRoutes: true },
    );

    act(() => {
      userEvent.click(saveButton);
    });

    await waitFor(() => expect(saveButton).toBeDisabled());

    expect(fetchMock.calls()[2]![0]).toEqual(
      `/api/markdown-documents/${markdownDocument.id}/`,
    );

    expect(fetchMock.calls()[2]![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        rendering_options: { useMathjax: true },
      }),
    });

    rerender(<MarkdownEditor />);

    userEvent.click(screen.getByRole('button', { name: 'Settings' })); // open the settings dropdown

    expect(
      screen.getByRole('checkbox', { name: 'Mathjax enabled' }),
    ).toBeChecked();
  });

  it('updates document when uploading an image', async () => {
    xhrMock.setup();

    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      is_draft: true,
      translations: [
        markdownTranslationMockFactory({
          language_code: 'en',
          content: '# Heading',
        }),
      ],
    });
    fetchMock.get('/api/markdown-documents/1/', markdownDocument);

    const { container } = render(
      <UploadManager>
        <MarkdownEditor />
      </UploadManager>,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Heading' }),
      ).toBeInTheDocument(),
    );

    const dropzoneInput = container.querySelector('input[type="file"]')!;

    // Drop an image
    const markdownImageId = '5459a5b2-2f81-11ed-ab8f-47c92ec0ac16';
    fetchMock.postOnce(
      `/api/markdown-images/`,
      markdownImageMockFactory({
        id: markdownImageId,
        active_stamp: null,
        filename: null,
        is_ready_to_show: false,
        upload_state: uploadState.PENDING,
        url: null,
      }),
    );
    fetchMock.postOnce(
      `/api/markdown-images/${markdownImageId}/initiate-upload/`,
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
    );
    const fileUploadDeferred = new Deferred<MockResponse>();
    xhrMock.post(
      'https://s3.aws.example.com/',
      () => fileUploadDeferred.promise,
    );

    const catFile = createFile('cats.gif', 1234, 'image/gif');
    act(() => {
      fireEvent.drop(dropzoneInput, createDtWithFiles([catFile]));
    });

    await waitFor(() =>
      expect(
        container.querySelector('div[class="cm-line"]')!,
      ).toHaveTextContent(`[//]: # (${markdownImageId})`),
    );

    expect(screen.getByRole('status')).toHaveTextContent('cats.gif0%');

    // Image is uploaded
    fetchMock.get(
      `/api/markdown-images/${markdownImageId}/`,
      markdownImageMockFactory({
        id: markdownImageId,
        is_ready_to_show: true,
        url: `https://s3.aws.example.com/markdown-image/${markdownImageId}`,
      }),
    );

    await act(() => {
      fileUploadDeferred.resolve(
        new MockResponse().body('form data body').status(204),
      );
    });

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Processing cats.gif',
      ),
    );

    // Image is processed
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Uploaded cats.gif');
    });
    await waitFor(() =>
      expect(
        container.querySelector('div[class="cm-line"]')!,
      ).toHaveTextContent(`![cats.gif](/uploaded/image/${markdownImageId})`),
    );

    await waitFor(() =>
      expect(
        within(screen.getByTestId('renderer_container')).getByRole('img'),
      ).toHaveAttribute(
        'src',
        `https://s3.aws.example.com/markdown-image/${markdownImageId}`,
      ),
    );

    xhrMock.teardown();
  });
});
