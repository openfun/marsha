import { screen } from '@testing-library/react';
import { Tabs } from 'grommet';
import { playlistMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import SelectContentTab from '.';

jest.mock('apps/markdown/data/MarkdownAppData', () => ({
  MarkdownAppData: {
    markdowns: [
      {
        id: 1,
        title: 'deposit title',
        description: 'deposit description',
        lti_url: 'http://example.com/lti_url',
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

describe('<SelectContentTab />', () => {
  afterEach(jest.resetAllMocks);

  it('selects content', () => {
    const currentPlaylist = playlistMockFactory();
    render(
      <Tabs>
        <SelectContentTab
          playlist={currentPlaylist}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
          setContentItemsValue={jest.fn()}
        />
      </Tabs>,
    );

    screen.getByRole('tab', { name: 'Markdown' });
    screen.getByText('Add a markdown document');
    expect(
      screen.getByLabelText('Select translated title'),
    ).toBeInTheDocument();
  });
});
