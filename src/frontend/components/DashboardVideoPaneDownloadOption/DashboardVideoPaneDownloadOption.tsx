import { Box, CheckBox, Form, Text } from 'grommet';
import React, { SyntheticEvent, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { updateResource } from '../../data/sideEffects/updateResource/updateResource';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';

const messages = defineMessages({
  allowDownload: {
    defaultMessage: 'Allow video download',
    description: '',
    id: 'component.DashboardVideoPaneDownloadOption.allowDownload',
  },
  updateVideoFail: {
    defaultMessage: 'Failed to update your video. Please try again later.',
    description: 'Failed to update download permission on your video.',
    id: 'component.DashboardVideoPaneDownloadOption.updateVideoFail',
  },
});

interface Props {
  jwt: string;
  addResource: (video: Video) => void;
  video: Video;
}

export const DashboardVideoPaneDownloadOption = ({
  jwt,
  video,
  addResource,
}: Props) => {
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(video.show_download);

  const onChange = async (event: SyntheticEvent<HTMLInputElement>) => {
    const showDownload = event.currentTarget.checked;
    event.stopPropagation();
    try {
      setChecked(showDownload);
      const newVideo = await updateResource(
        jwt,
        {
          ...video,
          show_download: showDownload,
        },
        modelName.VIDEOS,
      );
      addResource(newVideo);
    } catch (e) {
      setChecked(!showDownload);
      setError(true);
    }
  };

  return (
    <Box align={'center'} direction={'row'} pad={{ top: 'small' }}>
      <Form>
        <CheckBox
          id={'allowDownload'}
          onChange={onChange}
          checked={checked}
          label={<FormattedMessage {...messages.allowDownload} />}
          reverse={true}
          toggle
        />
        {error && (
          <Text id={'updateVideoFail'} color="status-error">
            <FormattedMessage {...messages.updateVideoFail} />
          </Text>
        )}
      </Form>
    </Box>
  );
};
