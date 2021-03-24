import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Grommet } from 'grommet';

import { appData } from '../../data/appData';
import {
  documentMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { SelectContent } from './index';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { uploadState } from '../../types/tracks';

jest.mock('../../data/appData', () => ({
  appData: {
    new_document_url: 'https://example.com/lti/documents/new-hash',
    new_video_url: 'https://example.com/lti/videos/new-hash',
    lti_select_form_action_url: '/lti/select/',
    lti_select_form_data: {},
  },
}));

jest.mock('../Loader', () => ({
  Loader: () => <span>Loader</span>,
}));

window.HTMLFormElement.prototype.submit = jest.fn();

describe('<SelectContent />', () => {
  afterEach(jest.resetAllMocks);

  describe('content', () => {
    it('displays content infos', async () => {
      render(
        wrapInIntlProvider(
          <Grommet>
            <SelectContent
              documents={[
                documentMockFactory({
                  id: '1',
                  title: 'Document 1',
                  upload_state: uploadState.PROCESSING,
                  is_ready_to_show: false,
                }),
              ]}
              videos={[
                videoMockFactory({
                  id: '1',
                  title: 'Video 1',
                  upload_state: uploadState.PROCESSING,
                  is_ready_to_show: false,
                }),
                videoMockFactory({
                  id: '2',
                  title: 'Video 2',
                  upload_state: uploadState.READY,
                  is_ready_to_show: true,
                }),
              ]}
              new_document_url={appData.new_document_url}
              new_video_url={appData.new_video_url}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={appData.lti_select_form_data!}
            />
          </Grommet>,
        ),
      );

      screen.getByTitle('Select Video 1');
      expect(
        screen.getByTitle('Select Video 1').getElementsByTagName('img')[0],
      ).toHaveAttribute('src', 'https://example.com/default_thumbnail/144');
      fireEvent.mouseEnter(screen.getByTitle('Select Video 1'));
      screen.getByText('Video 1');
      screen.getByLabelText('Not uploaded');
      screen.getByLabelText('Not ready to show');

      fireEvent.mouseEnter(screen.getByTitle('Select Video 2'));
      screen.getByLabelText('Uploaded');
      screen.getByLabelText('Ready to show');

      screen.getByRole('tab', {
        name: /videos/i,
      });

      const documentTab = screen.getByRole('tab', {
        name: 'Documents',
      });
      fireEvent.click(documentTab);
      fireEvent.mouseEnter(screen.getByTitle('Select Document 1'));
      screen.getByLabelText('Not uploaded');
      screen.getByLabelText('Not ready to show');
    });

    it('displays first available generated video thumbnail', async () => {
      render(
        wrapInIntlProvider(
          <Grommet>
            <SelectContent
              videos={[
                videoMockFactory({
                  id: '1',
                  title: 'Video 1',
                  upload_state: uploadState.PROCESSING,
                  is_ready_to_show: false,
                  urls: {
                    manifests: {
                      hls: '',
                    },
                    mp4: {},
                    thumbnails: {
                      480: 'https://example.com/default_thumbnail/480',
                      720: 'https://example.com/default_thumbnail/720',
                      1080: 'https://example.com/default_thumbnail/1080',
                    },
                  },
                }),
              ]}
              new_document_url={appData.new_document_url}
              new_video_url={appData.new_video_url}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={appData.lti_select_form_data!}
            />
          </Grommet>,
        ),
      );

      screen.getByTitle('Select Video 1');
      expect(
        screen.getByTitle('Select Video 1').getElementsByTagName('img')[0],
      ).toHaveAttribute('src', 'https://example.com/default_thumbnail/480');
    });

    it('displays first available uploaded video thumbnail', async () => {
      render(
        wrapInIntlProvider(
          <Grommet>
            <SelectContent
              videos={[
                videoMockFactory({
                  id: '1',
                  title: 'Video 1',
                  upload_state: uploadState.PROCESSING,
                  is_ready_to_show: false,
                  thumbnail: {
                    active_stamp: null,
                    is_ready_to_show: true,
                    upload_state: uploadState.READY,
                    id: '1',
                    video: '1',
                    urls: {
                      480: 'https://example.com/uploaded_thumbnail/480',
                      720: 'https://example.com/uploaded_thumbnail/720',
                      1080: 'https://example.com/uploaded_thumbnail/1080',
                    },
                  },
                }),
              ]}
              new_document_url={appData.new_document_url}
              new_video_url={appData.new_video_url}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={appData.lti_select_form_data!}
            />
          </Grommet>,
        ),
      );

      screen.getByTitle('Select Video 1');
      expect(
        screen.getByTitle('Select Video 1').getElementsByTagName('img')[0],
      ).toHaveAttribute('src', 'https://example.com/uploaded_thumbnail/480');
    });

    it('fallback to generated video thumbnail if uploaded thumbnail not ready', async () => {
      render(
        wrapInIntlProvider(
          <Grommet>
            <SelectContent
              videos={[
                videoMockFactory({
                  id: '1',
                  title: 'Video 1',
                  upload_state: uploadState.PROCESSING,
                  is_ready_to_show: false,
                  thumbnail: {
                    active_stamp: null,
                    is_ready_to_show: false,
                    upload_state: uploadState.PROCESSING,
                    id: '1',
                    video: '1',
                    urls: {
                      480: 'https://example.com/uploaded_thumbnail/480',
                      720: 'https://example.com/uploaded_thumbnail/720',
                      1080: 'https://example.com/uploaded_thumbnail/1080',
                    },
                  },
                }),
              ]}
              new_document_url={appData.new_document_url}
              new_video_url={appData.new_video_url}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={appData.lti_select_form_data!}
            />
          </Grommet>,
        ),
      );

      screen.getByTitle('Select Video 1');
      expect(
        screen.getByTitle('Select Video 1').getElementsByTagName('img')[0],
      ).toHaveAttribute('src', 'https://example.com/default_thumbnail/144');
    });

    it('video not uploaded', async () => {
      render(
        wrapInIntlProvider(
          <Grommet>
            <SelectContent
              videos={[
                videoMockFactory({
                  id: '1',
                  title: 'Video 1',
                  upload_state: uploadState.PENDING,
                  is_ready_to_show: false,
                  urls: null,
                }),
              ]}
              new_document_url={appData.new_document_url}
              new_video_url={appData.new_video_url}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={appData.lti_select_form_data!}
            />
          </Grommet>,
        ),
      );

      fireEvent.mouseEnter(screen.getByTitle('Select Video 1'));
      screen.getByText('Video 1');
      screen.getByLabelText('Not uploaded');
      screen.getByLabelText('Not ready to show');
    });

    it('select content', async () => {
      const { container } = render(
        wrapInIntlProvider(
          <SelectContent
            documents={[
              documentMockFactory({
                id: '1',
                title: 'Document 1',
                upload_state: uploadState.PROCESSING,
                is_ready_to_show: false,
              }),
            ]}
            lti_select_form_action_url={appData.lti_select_form_action_url!}
            lti_select_form_data={{
              lti_response_url: 'https://example.com/lti',
              lti_message_type: 'ContentItemSelection',
            }}
          />,
        ),
      );

      const documentTab = screen.getByRole('tab', {
        name: 'Documents',
      });
      fireEvent.click(documentTab);
      fireEvent.click(screen.getByTitle('Select Document 1'));

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

      expect(container.querySelector('form')).toHaveFormValues({
        lti_response_url: 'https://example.com/lti',
        lti_message_type: 'ContentItemSelection',
        content_items: JSON.stringify({
          '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
          '@graph': [
            {
              '@type': 'ContentItem',
              url: 'https://example.com/lti/documents/1',
              title: 'Document 1',
              frame: [],
            },
          ],
        }),
      });
    });

    it('add new content', async () => {
      const { container } = render(
        wrapInIntlProvider(
          <SelectContent
            documents={appData.documents}
            videos={appData.videos}
            new_document_url={appData.new_document_url}
            new_video_url={appData.new_video_url}
            lti_select_form_action_url={appData.lti_select_form_action_url!}
            lti_select_form_data={appData.lti_select_form_data!}
          />,
        ),
      );
      fireEvent.click(screen.getByText('Add a video'));

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

      const form = container.querySelector('form');
      expect(form).toHaveFormValues({
        content_items: JSON.stringify({
          '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
          '@graph': [
            {
              '@type': 'ContentItem',
              url: 'https://example.com/lti/videos/new-hash',
              title: 'New video',
              frame: [],
            },
          ],
        }),
      });
      expect(form).toHaveAttribute('action', '/lti/select/');
    });
  });
});
