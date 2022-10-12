import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import { markdownDocumentMockFactory } from 'apps/markdown/utils/tests/factories';
import { playlistMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import SelectContentResource from '.';

jest.mock('apps/markdown/data/MarkdownAppData', () => ({
  MarkdownAppData: {
    markdowns: [
      {
        id: 1,
        title: 'deposit title',
        description: 'deposit description',
        lti_url: 'https://example.com/lti_url',
        translations: [
          {
            title: 'translated title',
            language_code: 'en',
          },
        ],
      },
    ],
    new_markdown_url: 'https://example.com/lti/markdownDocuments/',
  },
}));

const currentPlaylist = playlistMockFactory();

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('displays available markdown documents', async () => {
    render(
      <SelectContentResource
        playlist={currentPlaylist}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: 'Markdown' });
    screen.getByText('Add a markdown document');

    screen.getByTitle('Select translated title');
  });

  it('displays available markdown documents and select existing one', async () => {
    render(
      <SelectContentResource
        playlist={currentPlaylist}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: 'Markdown' });
    screen.getByText('Add a markdown document');

    userEvent.click(screen.getByTitle('Select translated title'));

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti_url',
            frame: [],
            title: 'translated title',
          },
        ],
      }),
    );
  });

  it('displays available classrooms and clieck to create a new one', async () => {
    const playlist = playlistMockFactory();
    const newMarkdownDocument = markdownDocumentMockFactory();
    fetchMock.post('/api/markdown-documents/', newMarkdownDocument);
    render(
      <SelectContentResource
        playlist={playlist}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: 'Markdown' });
    screen.getByTitle('Select translated title');
    userEvent.click(screen.getByText('Add a markdown document'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/markdown-documents/', {
          body: {
            playlist: playlist.id,
          },
          method: 'POST',
        }),
      ).toBe(true);
    });

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/markdownDocuments/${newMarkdownDocument.id}`,
            frame: [],
            title: newMarkdownDocument.translations[0].title,
          },
        ],
      }),
    );
  });
});
