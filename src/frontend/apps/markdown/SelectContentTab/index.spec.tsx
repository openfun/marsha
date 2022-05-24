import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import {
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
} from 'apps/markdown/utils/tests/factories';
import { SelectContent } from 'components/SelectContent';
import { appData } from 'data/appData';
import { playlistMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

jest.mock('settings', () => ({
  APPS: ['markdown'],
}));

jest.mock('data/appData', () => ({
  appData: {
    new_document_url: 'https://example.com/lti/documents/new-hash',
    new_video_url: 'https://example.com/lti/videos/new-hash',
    lti_select_form_action_url: '/lti/select/',
    lti_select_form_data: {},
    flags: {
      markdown: true,
    },
  },
}));

window.HTMLFormElement.prototype.submit = jest.fn();

const currentPlaylist = playlistMockFactory();

const documentTranslation = markdownTranslationMockFactory({
  title: 'Easy to find title',
  language_code: window.navigator.language.substring(0, 2),
});
const markdownDocument = markdownDocumentMockFactory({
  playlist: currentPlaylist,
  translations: [documentTranslation],
});
const documentMissingTranslation = markdownTranslationMockFactory({
  title: 'Easy to find title',
  language_code: 'wrong',
});
const documentNotTranslated = markdownDocumentMockFactory({
  playlist: currentPlaylist,
  translations: [documentMissingTranslation],
});
const selectMarkdownResponse = {
  new_url: 'https://example.com/lti/markdown-documents/',
  markdown_documents: [markdownDocument, documentNotTranslated],
};

fetchMock.get('/api/markdown-documents/lti-select/', selectMarkdownResponse);

describe('<SelectContent />', () => {
  afterEach(jest.resetAllMocks);

  it('selects content', async () => {
    const queryClient = new QueryClient();

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const markdownTab = await screen.findByRole('tab', {
      name: 'Markdown',
    });
    userEvent.click(markdownTab);
    userEvent.click(screen.getByTitle('Select Easy to find title'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: markdownDocument.lti_url,
            frame: [],
            title: 'Easy to find title',
          },
        ],
      }),
    });
  });

  it('selects content with activity title and description', async () => {
    const queryClient = new QueryClient();

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
                activity_title: 'Activity title',
                activity_description: 'Activity description',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const markdownTab = await screen.findByRole('tab', {
      name: 'Markdown',
    });
    userEvent.click(markdownTab);
    userEvent.click(screen.getByTitle('Select Easy to find title'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: markdownDocument.lti_url,
            frame: [],
            title: 'Activity title',
            text: 'Activity description',
          },
        ],
      }),
    });
  });

  it('selects content with empty activity title and description', async () => {
    const queryClient = new QueryClient();

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
                activity_title: '',
                activity_description: '',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const markdownTab = await screen.findByRole('tab', {
      name: 'Markdown',
    });
    userEvent.click(markdownTab);
    userEvent.click(screen.getByTitle('Select Easy to find title'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: markdownDocument.lti_url,
            frame: [],
            title: 'Easy to find title',
          },
        ],
      }),
    });
  });

  it('selects content with missing translation', async () => {
    const queryClient = new QueryClient();

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const markdownTab = await screen.findByRole('tab', {
      name: 'Markdown',
    });
    userEvent.click(markdownTab);
    userEvent.click(screen.getByTitle('Select Missing title'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: documentNotTranslated.lti_url,
            frame: [],
            title: 'Missing title',
          },
        ],
      }),
    });
  });

  it('adds new content', async () => {
    const queryClient = new QueryClient();
    const newDocumentTranslation = markdownTranslationMockFactory({
      title: undefined,
      language_code: window.navigator.language.substring(0, 2),
    });
    const newMarkdownDocument = markdownDocumentMockFactory({
      playlist: currentPlaylist,
      translations: [newDocumentTranslation],
    });
    fetchMock.post('/api/markdown-documents/', newMarkdownDocument);

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              playlist={currentPlaylist}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const markdownTab = await screen.findByRole('tab', {
      name: 'Markdown',
    });
    userEvent.click(markdownTab);
    userEvent.click(screen.getByText('Add a markdown document'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/markdown-documents/', {
          body: {
            playlist: currentPlaylist.id,
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/markdown-documents/${newMarkdownDocument.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content with activity title and description', async () => {
    const queryClient = new QueryClient();
    const newDocumentTranslation = markdownTranslationMockFactory({
      title: undefined,
      language_code: window.navigator.language.substring(0, 2),
    });
    const newMarkdownDocument = markdownDocumentMockFactory({
      playlist: currentPlaylist,
      translations: [newDocumentTranslation],
    });
    fetchMock.post('/api/markdown-documents/', newMarkdownDocument, {
      overwriteRoutes: true,
    });

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              playlist={currentPlaylist}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
                activity_title: 'Activity title',
                activity_description: 'Activity description',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const markdownTab = await screen.findByRole('tab', {
      name: 'Markdown',
    });
    userEvent.click(markdownTab);
    userEvent.click(screen.getByText('Add a markdown document'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/markdown-documents/', {
          body: {
            playlist: currentPlaylist.id,
            title: 'Activity title',
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/markdown-documents/${newMarkdownDocument.id}`,
            frame: [],
            title: 'Activity title',
            text: 'Activity description',
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content with empty activity title and description', async () => {
    const queryClient = new QueryClient();
    const newDocumentTranslation = markdownTranslationMockFactory({
      title: undefined,
      language_code: window.navigator.language.substring(0, 2),
    });
    const newMarkdownDocument = markdownDocumentMockFactory({
      playlist: currentPlaylist,
      translations: [newDocumentTranslation],
    });
    fetchMock.post('/api/markdown-documents/', newMarkdownDocument, {
      overwriteRoutes: true,
    });

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              playlist={currentPlaylist}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
                activity_title: '',
                activity_description: '',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const markdownTab = await screen.findByRole('tab', {
      name: 'Markdown',
    });
    userEvent.click(markdownTab);
    userEvent.click(screen.getByText('Add a markdown document'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/markdown-documents/', {
          body: {
            playlist: currentPlaylist.id,
            title: 'Activity title',
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/markdown-documents/${newMarkdownDocument.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });
});
