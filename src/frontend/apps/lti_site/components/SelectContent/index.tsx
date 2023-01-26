import { Box } from 'grommet';
import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import {
  LtiSelectResource,
  Document,
  Live,
  Playlist,
  Video,
  CopyClipboard,
} from 'lib-components';

import { SelectContentTabs } from './SelectContentTabs';
import { SelectContentTargetedResource } from './SelectContentTargetedResource';

const messages = defineMessages({
  playlistTitle: {
    defaultMessage: 'Playlist {title} ({id})',
    description: 'Title for the current playlist.',
    id: 'component.SelectContent.playlistTitle',
  },
  copied: {
    defaultMessage: '{text} copied!',
    description: 'Message displayed when playlist info are copied.',
    id: 'components.SelectContent.copied',
  },
});

interface SelectContentProps {
  playlist?: Playlist;
  documents?: Document[];
  videos?: Video[];
  webinars?: Live[];
  new_document_url?: string;
  new_video_url?: string;
  new_webinar_url?: string;
  lti_select_form_action_url: string;
  lti_select_form_data: {
    [key: string]: string;
  };
  targeted_resource?: LtiSelectResource;
}

export const SelectContent = ({
  playlist,
  documents,
  videos,
  webinars,
  new_document_url,
  new_video_url,
  new_webinar_url,
  lti_select_form_action_url,
  lti_select_form_data,
  targeted_resource,
}: SelectContentProps) => {
  const [contentItemsValue, setContentItemsValue] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const intl = useIntl();

  useEffect(() => {
    if (formRef.current && contentItemsValue) {
      formRef.current.submit();
    }
  }, [contentItemsValue]);

  return (
    <Box pad="medium">
      <Box justify="center" align="center" direction="row">
        <CopyClipboard
          copyId={`key-${playlist?.id}`}
          text={
            <FormattedMessage
              {...messages.playlistTitle}
              values={{ title: playlist?.title, id: playlist?.id }}
            />
          }
          textToCopy={playlist?.id}
          title={`copy key ${playlist?.id}`}
          onSuccess={(event) => {
            toast.success(
              intl.formatMessage(messages.copied, { text: event.text }),
            );
          }}
          onError={(event) => {
            toast.error(event.text);
          }}
        />
      </Box>

      <form
        ref={formRef}
        action={lti_select_form_action_url}
        method="POST"
        encType="application/x-www-form-urlencoded"
      >
        {Object.entries(lti_select_form_data!).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

        <input type="hidden" name="content_items" value={contentItemsValue} />
      </form>

      {targeted_resource && (
        <SelectContentTargetedResource
          playlist={playlist}
          documents={documents}
          videos={videos}
          webinars={webinars}
          new_document_url={new_document_url}
          new_video_url={new_video_url}
          new_webinar_url={new_webinar_url}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
          targeted_resource={targeted_resource}
        />
      )}

      {!targeted_resource && (
        <SelectContentTabs
          playlist={playlist}
          documents={documents}
          videos={videos}
          webinars={webinars}
          new_document_url={new_document_url}
          new_video_url={new_video_url}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
        />
      )}
    </Box>
  );
};
