import { Anchor, Box, Button, Text } from 'grommet';
import { createVOD, useClassroom } from 'lib-classroom';
import { Nullable } from 'lib-common';
import {
  ClassroomRecording,
  CopyClipboard,
  useCurrentResourceContext,
} from 'lib-components';
import React, { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { IntlShape, defineMessages, useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { DeleteClassroomRecordingButton } from './DeleteClassroomRecordingButton';

const StyledAnchor = styled(Anchor)`
  font-family: Roboto-Medium;
`;

const NavLinkStyled = styled(NavLink)`
  text-decoration: none;
  font-weight: bold;
  font-family: Roboto-Medium;
  padding-bottom: 0.5rem;
`;

const messages = defineMessages({
  downloadRecordingLabel: {
    defaultMessage: 'Download recording',
    description: 'Label for download recording button.',
    id: 'component.Recording.downloadRecordingLabel',
  },
  convertVODLabel: {
    defaultMessage: 'Convert to VOD',
    description: 'Label for convert to VOD button.',
    id: 'component.Recording.convertVODLabel',
  },
  convertVODTitle: {
    defaultMessage: 'Convert {recordingTitle} to VOD',
    description: 'Title for convert to VOD button.',
    id: 'component.Recording.convertVODTitle',
  },
  conversionDisabled: {
    defaultMessage: 'VOD conversion is disabled',
    description: 'Message when VOD conversion is disabled.',
    id: 'component.Recording.conversionDisabled',
  },
  ltiLinkLabel: {
    defaultMessage: 'LTI link for this VOD:',
    description: 'Label for LTI VOD link.',
    id: 'component.Recording.ltiLinkLabel',
  },
  ltiLinkLabelWithUploadState: {
    defaultMessage: 'LTI link for this VOD: ({uploadState})',
    description: 'Label for LTI VOD link with upload state.',
    id: 'component.Recording.ltiLinkLabelWithUploadState',
  },
  ltiLinkCopiedSuccess: {
    defaultMessage: 'Url copied to clipboard !',
    description: 'Toast message when link copied to clipboard.',
    id: 'component.Recording.ltiLinkCopiedSuccess',
  },
  vodDashboardLabel: {
    defaultMessage: 'Navigate to VOD Dashboard',
    description: 'Label for VOD dashboard link.',
    id: 'component.Recording.vodDashboardLabel',
  },
});

const buildRecordingTitle = (
  recording: ClassroomRecording,
  intl: IntlShape,
) => {
  return (
    intl.formatDate(recording.started_at, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }) +
    ' - ' +
    intl.formatDate(recording.started_at, {
      hour: 'numeric',
      minute: 'numeric',
    })
  );
};

interface RecordingProps {
  recording: ClassroomRecording;
  classroomTitle?: Nullable<string>;
  conversionEnabled?: boolean;
}

const VodNotReady = ({
  recording,
  classroomTitle,
  conversionEnabled,
}: RecordingProps) => {
  const intl = useIntl();
  const { refetch: refetchClassroom } = useClassroom(recording.classroom);

  const convertVOD = useCallback(
    (recording: ClassroomRecording) => {
      let title = buildRecordingTitle(recording, intl);
      if (classroomTitle) {
        title = `${classroomTitle} - ${title}`;
      }

      createVOD(recording, title).then(() => {
        refetchClassroom();
      });
    },
    [classroomTitle, intl, refetchClassroom],
  );

  return (
    <Box
      direction="row"
      key={recording.id}
      align="center"
      fill="horizontal"
      gap="medium"
      pad={recording.vod ? 'none' : 'small'}
      justify="between"
    >
      {!recording.vod && (
        <DeleteClassroomRecordingButton recording={recording} />
      )}

      <StyledAnchor
        title={intl.formatMessage(messages.downloadRecordingLabel)}
        href={recording.video_file_url}
        target="_blank"
        rel="noreferrer noopener"
      >
        <Text
          color="blue-active"
          size="0.9rem"
          style={{ whiteSpace: 'initial' }}
        >
          {recording.vod
            ? recording.vod.title
            : buildRecordingTitle(recording, intl)}
        </Text>
      </StyledAnchor>
      {recording.vod ? (
        <Text color="blue-active" size="0.9rem">
          {recording.vod.upload_state}
        </Text>
      ) : (
        <Button
          a11yTitle={
            conversionEnabled
              ? intl.formatMessage(messages.convertVODTitle, {
                  recordingTitle: buildRecordingTitle(recording, intl),
                })
              : intl.formatMessage(messages.conversionDisabled)
          }
          title={
            conversionEnabled
              ? intl.formatMessage(messages.convertVODTitle, {
                  recordingTitle: buildRecordingTitle(recording, intl),
                })
              : intl.formatMessage(messages.conversionDisabled)
          }
          label={intl.formatMessage(messages.convertVODLabel)}
          onClick={() => convertVOD(recording)}
          size="xsmall"
          disabled={!conversionEnabled}
        />
      )}
    </Box>
  );
};

const VodReady = ({ recording }: RecordingProps) => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  if (!recording.vod) {
    return null;
  }

  const ltiLink = recording.vod
    ? `${window.location.origin}/lti/videos/${recording.vod.id}`
    : null;

  return (
    <React.Fragment>
      {context.isFromWebsite && (
        <NavLinkStyled
          to={`/my-contents/videos/${recording.vod.id}`}
          title={intl.formatMessage(messages.vodDashboardLabel)}
        >
          <Text color="blue-active" size="0.9rem">
            {recording.vod.title}
          </Text>
        </NavLinkStyled>
      )}
      {ltiLink && (
        <CopyClipboard
          copyId={`ltiLink-${recording.vod.id}`}
          text={ltiLink}
          title={intl.formatMessage(messages.ltiLinkLabel)}
          withLabel={true}
          onSuccess={() => {
            toast(intl.formatMessage(messages.ltiLinkCopiedSuccess), {
              icon: '📋',
            });
          }}
          onError={(event) => {
            toast.error(event.text, {
              position: 'bottom-center',
            });
          }}
        />
      )}
    </React.Fragment>
  );
};

export const Recording = ({
  recording,
  classroomTitle,
  conversionEnabled,
}: RecordingProps) => (
  <React.Fragment>
    {recording.vod ? (
      <Box
        direction="column"
        key={recording.id}
        align="start"
        fill="horizontal"
        gap="medium"
        pad="small"
      >
        {recording.vod.upload_state === 'ready' ? (
          <VodReady recording={recording} />
        ) : (
          <VodNotReady recording={recording} />
        )}
      </Box>
    ) : (
      <VodNotReady
        recording={recording}
        classroomTitle={classroomTitle}
        conversionEnabled={conversionEnabled}
      />
    )}
  </React.Fragment>
);
