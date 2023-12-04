import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { playlistMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { fileDepositoryMockFactory } from 'apps/deposit/utils/tests/factories';

import SelectContentResource from '.';

jest.mock('apps/deposit/data/depositAppData', () => ({
  depositAppData: {
    deposits: [
      {
        id: 1,
        title: 'deposit title',
        description: 'deposit description',
        lti_url: 'https://example.com/lti_url',
      },
    ],
    new_deposit_url: 'https://example.com/lti/fileDepositories/',
  },
}));

const currentPlaylist = playlistMockFactory();

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('displays available file depositories', () => {
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

    screen.getByRole('heading', { name: 'File Depositories' });
    screen.getByText('Add a file depository');

    expect(screen.getByLabelText('Select deposit title')).toBeInTheDocument();
  });

  it('displays available file depositories and select existing one', async () => {
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

    screen.getByRole('heading', { name: 'File Depositories' });
    screen.getByText('Add a file depository');

    await userEvent.click(screen.getByLabelText('Select deposit title'));

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti_url',
            frame: [],
            title: 'deposit title',
            text: 'deposit description',
          },
        ],
      }),
    );
  });

  it('displays available classrooms and clieck to create a new one', async () => {
    const playlist = playlistMockFactory();
    const newFileDepository = fileDepositoryMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/filedepositories/', newFileDepository);
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

    screen.getByRole('heading', { name: 'File Depositories' });
    screen.getByText('Add a file depository');
    screen.getByLabelText('Select deposit title');
    await userEvent.click(screen.getByText('Add a file depository'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/filedepositories/', {
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
            url: `https://example.com/lti/fileDepositories/${newFileDepository.id}`,
            frame: [],
          },
        ],
      }),
    );
  });
});
