import React, { ComponentProps } from 'react';
import { Story } from '@storybook/react';

import { SelectContent } from './index';
import {
  documentMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { uploadState } from '../../types/tracks';

// 👇 This default export determines where your story goes in the story list
export default {
  title: 'LTI/Select Content',
  component: SelectContent,
};

// 👇 We create a “template” of how args map to rendering
const Template: Story<ComponentProps<typeof SelectContent>> = (args) => (
  <SelectContent {...args} />
);

export const NoContent = Template.bind({});
NoContent.args = {
  /*👇 The args you need here will depend on your component */
  lti_select_form_data: {
    lti_version: 'lti version',
    data: 'custom consumer data',
    content_items: 'some lti content',
  },
  lti_select_form_action_url: 'http://return.url/',
};

const thumbnails = {
  144: 'https://via.placeholder.com/256x144',
  240: 'https://via.placeholder.com/426x240',
  480: 'https://via.placeholder.com/854x480',
  720: 'https://via.placeholder.com/1280x720',
  1080: 'https://via.placeholder.com/1920x1080',
};

const urls = {
  manifests: { hls: '' },
  mp4: {},
  thumbnails,
};

export const VideosAndDocuments = Template.bind({});
VideosAndDocuments.args = {
  /*👇 The args you need here will depend on your component */
  documents: [
    documentMockFactory({
      id: '1',
      title: 'Document 1',
      upload_state: uploadState.PROCESSING,
      is_ready_to_show: false,
    }),
  ],
  videos: [
    videoMockFactory({
      id: '1',
      title: 'Video 1',
      upload_state: uploadState.PROCESSING,
      is_ready_to_show: false,
      urls,
    }),
    videoMockFactory({
      id: '2',
      title: '52922387-a2fe-4c19-9cab-bcc8cd9033c1',
      upload_state: uploadState.READY,
      is_ready_to_show: true,
      urls,
    }),
    videoMockFactory({
      id: '1',
      title: 'Video 1',
      upload_state: uploadState.PROCESSING,
      is_ready_to_show: false,
      urls,
    }),
    ...Array(9).fill(
      videoMockFactory({
        id: '2',
        title: 'Video 2',
        upload_state: uploadState.READY,
        is_ready_to_show: true,
        urls,
      }),
    ),
    videoMockFactory({
      id: '1',
      title: 'Video 1',
      upload_state: uploadState.PROCESSING,
      is_ready_to_show: false,
      urls,
    }),
  ],
  lti_select_form_data: {
    lti_version: 'lti version',
    data: 'custom consumer data',
    content_items: 'some lti content',
  },
  lti_select_form_action_url: 'http://return.url/',
  new_document_url: 'https://example.com/lti/documents/new-hash',
  new_video_url: 'https://example.com/lti/videos/new-hash',
};
