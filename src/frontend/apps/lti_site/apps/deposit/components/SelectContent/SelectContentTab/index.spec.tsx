import { screen } from '@testing-library/react';
import { Tabs } from 'grommet';
import { playlistMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import SelectContentTab from '.';

jest.mock('apps/deposit/data/depositAppData', () => ({
  depositAppData: {
    deposits: [
      {
        id: 1,
        title: 'deposit title',
        description: 'deposit description',
        lti_url: 'http://example.com/lti_url',
      },
    ],
    new_deposit_url: 'https://example.com/lti/fileDepositories/',
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

    screen.getByRole('tab', { name: 'File Depositories' });
    screen.getByText('Add a file depository');
    expect(screen.getByLabelText('Select deposit title')).toBeInTheDocument();
  });
});
