import { CunninghamProvider, DatePicker } from '@openfun/cunningham-react';
import { Box, Button } from 'grommet';
import { Nullable } from 'lib-common';
import { FoldableItem, Video, debounce } from 'lib-components';
import { DateTime } from 'luxon';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to change the retention date of the video. Once this date is reached, the video will be deleted.',
    description: 'Info of the widget used to change video retention date.',
    id: 'components.VideoRetentionDate.info',
  },
  title: {
    defaultMessage: 'Retention date',
    description: 'Title of the widget used to change video retention date.',
    id: 'components.VideoRetentionDate.title',
  },
  updateVideoSuccess: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.VideoRetentionDate.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed!',
    description: 'Message displayed when video update has failed.',
    id: 'component.VideoRetentionDate.updateVideoFail',
  },
  deleteVideoRetentionDateButton: {
    defaultMessage: 'Delete retention date',
    description: 'Button used to delete video retention date.',
    id: 'component.VideoRetentionDate.deleteVideoRetentionDateButton',
  },
});

const StyledAnchorButton = styled(Button)`
  height: 50px;
  font-family: 'Roboto-Medium';
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const RetentionDate = () => {
  const intl = useIntl();
  const video = useCurrentVideo();
  const [selectedRetentionDate, setSelectedRetentionDate] = useState<
    Nullable<string>
  >(video.retention_date);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSuccess), {
        position: 'bottom-center',
      });
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  const debouncedUpdatedVideo = debounce<Video>(
    (updatedVideoProperty: Partial<Video>) => {
      videoMutation.mutate(updatedVideoProperty);
    },
  );

  /**
   * @param new_retention_date in the format YYYY-MM-DD HH:MM:SS (ISO 8601) UTC
   * @returns
   */
  function onChange(new_retention_date: string | null) {
    /**
     * The date is in UTC format so not as the client has chosen.
     * We need to convert it to local date, then reconvert to YYYY-MM-DD
     * locale `en-CA` is used to convert the date in the format YYYY-MM-DD
     */
    const local_new_retention_date = new_retention_date
      ? new Date(new_retention_date).toLocaleDateString('en-CA')
      : null;

    setSelectedRetentionDate(local_new_retention_date || null);

    if (
      new_retention_date &&
      new Date(new_retention_date).getTime() <=
        new Date(DateTime.local().toISODate() || '').getTime()
    ) {
      return;
    }

    debouncedUpdatedVideo({
      retention_date: local_new_retention_date,
    });
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box
        direction="column"
        gap="small"
        style={{ marginTop: '0.75rem' }}
        data-testid="retention-date-picker"
      >
        <CunninghamProvider>
          <DatePicker
            fullWidth
            label={intl.formatMessage(messages.title)}
            locale={intl.locale}
            minValue={
              DateTime.local()
                .plus({ days: 1 })
                .set({
                  hour: 0,
                  minute: 0,
                  second: 0,
                })
                .toISO() as string
            }
            onChange={onChange}
            value={
              selectedRetentionDate
                ? new Date(selectedRetentionDate).toISOString()
                : null
            }
          />
        </CunninghamProvider>
        <StyledAnchorButton
          disabled={!selectedRetentionDate}
          a11yTitle={intl.formatMessage(
            messages.deleteVideoRetentionDateButton,
          )}
          fill="horizontal"
          label={intl.formatMessage(messages.deleteVideoRetentionDateButton)}
          primary
          title={intl.formatMessage(messages.deleteVideoRetentionDateButton)}
          onClick={() => {
            onChange('');
          }}
        />
      </Box>
    </FoldableItem>
  );
};
