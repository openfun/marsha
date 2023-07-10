import { Box } from 'grommet';
import {
  Document,
  Live,
  LtiSelectResource,
  Playlist,
  Video,
} from 'lib-components';
import React, { useEffect } from 'react';

import { SelectContentTabs } from './SelectContentTabs';
import { SelectContentTargetedResource } from './SelectContentTargetedResource';

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

  useEffect(() => {
    if (formRef.current && contentItemsValue) {
      formRef.current.submit();
    }
  }, [contentItemsValue]);

  return (
    <Box pad="medium">
      <form
        ref={formRef}
        action={lti_select_form_action_url}
        method="POST"
        encType="application/x-www-form-urlencoded"
      >
        {Object.entries(lti_select_form_data).map(([name, value]) => (
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
