import { Box, CheckBox, Form, Text } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { updateResource } from '../../data/sideEffects/updateResource';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
import { useAsyncEffect } from '../../utils/useAsyncEffect';

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

interface BaseDashboardVideoPaneDownloadOptionProps {
  doAddResource: (video: Video) => void;
  video: Video;
}

const BaseDashboardVideoPaneDownloadOption = ({
  video,
  doAddResource,
}: BaseDashboardVideoPaneDownloadOptionProps) => {
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(video.show_download);

  useAsyncEffect(async () => {
    if (checked !== video.show_download) {
      try {
        const newVideo = await updateResource(
          {
            ...video,
            show_download: checked,
          },
          modelName.VIDEOS,
        );
        doAddResource(newVideo);
      } catch (e) {
        setChecked(!checked);
        setError(true);
      }
    }
  }, [checked]);

  return (
    <Box align={'center'} direction={'row'} pad={{ top: 'small' }}>
      <Form>
        <CheckBox
          id={'allowDownload'}
          onChange={() => setChecked(!checked)}
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

const mapDistachToProps = (dispatch: Dispatch) => ({
  doAddResource: (video: Video) =>
    dispatch(addResource(modelName.VIDEOS, video)),
});

/**
 * Component. Form with a checkbox to allow/disallow users to download video files.
 * @param video The video for which to allow/disallow file downloads.
 */
export const DashboardVideoPaneDownloadOption = connect(
  null,
  mapDistachToProps,
)(BaseDashboardVideoPaneDownloadOption);
