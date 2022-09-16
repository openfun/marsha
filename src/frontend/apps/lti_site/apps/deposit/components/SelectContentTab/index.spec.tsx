import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';

import { SelectContent } from 'components/SelectContent';
import { playlistMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { fileDepositoryMockFactory } from 'apps/deposit/utils/tests/factories';

jest.mock('settings', () => ({
  APPS: ['deposit'],
}));

const appData = {
  new_document_url: 'https://example.com/lti/documents/new-hash',
  new_video_url: 'https://example.com/lti/videos/new-hash',
  lti_select_form_action_url: '/lti/select/',
  lti_select_form_data: {},
  flags: {
    deposit: true,
    markdown: false,
  },
};

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => appData,
}));

window.HTMLFormElement.prototype.submit = jest.fn();

const currentPlaylist = playlistMockFactory();

const fileDepository = fileDepositoryMockFactory({
  title: 'fileDepository 1',
  playlist: currentPlaylist,
});
const selectFileDepositoryResponse = {
  new_url: 'https://example.com/lti/fileDepositories/',
  file_depositories: [fileDepository],
};

fetchMock.get(
  '/api/filedepositories/lti-select/',
  selectFileDepositoryResponse,
);

describe('<SelectContent />', () => {
  afterEach(jest.resetAllMocks);

  it('selects content', async () => {
    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
        />
      </Suspense>,
    );

    const fileDepositoryTab = await screen.findByRole('tab', {
      name: 'FileDepositories',
    });
    userEvent.click(fileDepositoryTab);
    userEvent.click(screen.getByTitle(`Select ${fileDepository.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: fileDepository.lti_url,
            frame: [],
            title: fileDepository.title,
            text: fileDepository.description,
          },
        ],
      }),
    });
  });

  it('selects content with activity title and description', async () => {
    const { container } = render(
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
      </Suspense>,
    );

    const fileDepositoryTab = await screen.findByRole('tab', {
      name: 'FileDepositories',
    });
    userEvent.click(fileDepositoryTab);
    userEvent.click(screen.getByTitle(`Select ${fileDepository.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: fileDepository.lti_url,
            frame: [],
            title: 'Activity title',
            text: 'Activity description',
          },
        ],
      }),
    });
  });

  it('selects content with empty activity title and description', async () => {
    const { container } = render(
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
      </Suspense>,
    );

    const fileDepositoryTab = await screen.findByRole('tab', {
      name: 'FileDepositories',
    });
    userEvent.click(fileDepositoryTab);
    userEvent.click(screen.getByTitle(`Select ${fileDepository.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: fileDepository.lti_url,
            frame: [],
            title: fileDepository.title,
            text: fileDepository.description,
          },
        ],
      }),
    });
  });

  it('adds new content', async () => {
    const playlist = playlistMockFactory();
    const newFileDepository = fileDepositoryMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/filedepositories/', newFileDepository);

    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          playlist={playlist}
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
        />
      </Suspense>,
    );

    const fileDepositoryTab = await screen.findByRole('tab', {
      name: 'FileDepositories',
    });
    userEvent.click(fileDepositoryTab);
    userEvent.click(screen.getByText('Add a file depository'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/filedepositories/', {
          body: {
            playlist: playlist.id,
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
            url: `https://example.com/lti/fileDepositories/${newFileDepository.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content with activity title and description', async () => {
    const playlist = playlistMockFactory();
    const newFileDepository = fileDepositoryMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/filedepositories/', newFileDepository, {
      overwriteRoutes: true,
    });

    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          playlist={playlist}
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
            activity_title: 'Activity title',
            activity_description: 'Activity description',
          }}
        />
      </Suspense>,
    );

    const fileDepositoryTab = await screen.findByRole('tab', {
      name: 'FileDepositories',
    });
    userEvent.click(fileDepositoryTab);
    userEvent.click(screen.getByText('Add a file depository'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/filedepositories/', {
          body: {
            playlist: playlist.id,
            title: 'Activity title',
            description: 'Activity description',
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
            url: `https://example.com/lti/fileDepositories/${newFileDepository.id}`,
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
    const playlist = playlistMockFactory();
    const newFileDepository = fileDepositoryMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/filedepositories/', newFileDepository, {
      overwriteRoutes: true,
    });

    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          playlist={playlist}
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
            activity_title: '',
            activity_description: '',
          }}
        />
      </Suspense>,
    );

    const fileDepositoryTab = await screen.findByRole('tab', {
      name: 'FileDepositories',
    });
    userEvent.click(fileDepositoryTab);
    userEvent.click(screen.getByText('Add a file depository'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/filedepositories/', {
          body: {
            playlist: playlist.id,
            title: '',
            description: '',
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
            url: `https://example.com/lti/fileDepositories/${newFileDepository.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });
});
