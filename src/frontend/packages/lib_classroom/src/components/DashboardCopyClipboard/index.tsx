import { Nullable } from 'lib-common';
import { Box, ClosingCard, CopyClipboard, Text } from 'lib-components';
import React from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  shareViewerLinkLabel: {
    defaultMessage: 'Invite a viewer with this link:',
    description: 'Label input shareable link with student.',
    id: 'component.DashboardCopyClipboard.shareLinkLabel',
  },
  shareModeratorLinkLabel: {
    defaultMessage: 'Invite a moderator with this link:',
    description: 'Label input shareable link with instructor.',
    id: 'component.DashboardCopyClipboard.shareModeratorLinkLabel',
  },
  toastCopiedClipboardSuccess: {
    defaultMessage: 'Url copied to clipboard !',
    description: 'Toast message when link copied to clipboard.',
    id: 'component.DashboardCopyClipboard.toastCopiedClipboardSuccess',
  },
  ltiLinkLabel: {
    defaultMessage: 'LTI link for this classroom:',
    description: 'Label for LTI classroom link.',
    id: 'component.DashboardCopyClipboard.ltiLinkLabel',
  },
  ltiLinkCopiedSuccess: {
    defaultMessage: 'Url copied to clipboard !',
    description: 'Toast message when link copied to clipboard.',
    id: 'component.DashboardCopyClipboard.ltiLinkCopiedSuccess',
  },
  linksExpired: {
    defaultMessage:
      'Invitation links have changed and should be shared with your users again.',
    description: 'Message when tokens start by "pub_" or "inst_".',
    id: 'component.DashboardCopyClipboard.linksExpired',
  },
});

interface DashboardCopyClipboardProps {
  inviteToken?: Nullable<string>;
  instructorToken?: Nullable<string>;
  classroomId: string;
}

const DashboardCopyClipboard = ({
  inviteToken,
  instructorToken,
  classroomId,
}: DashboardCopyClipboardProps) => {
  const intl = useIntl();

  const inviteLink = inviteToken
    ? `${window.location.origin}/my-contents/classroom/${classroomId}/invite/${inviteToken}`
    : '';
  const instructorLink = instructorToken
    ? `${window.location.origin}/my-contents/classroom/${classroomId}/invite/${instructorToken}`
    : '';
  const ltiLink = `${window.location.origin}/lti/classrooms/${classroomId}`;

  const hasLinksChanged =
    inviteToken?.slice(0, 4) === 'pub_' ||
    inviteToken?.slice(0, 5) === 'inst_' ||
    instructorToken?.slice(0, 4) === 'pub_' ||
    instructorToken?.slice(0, 5) === 'inst_'
      ? true
      : false;

  return (
    <React.Fragment>
      {hasLinksChanged && (
        <ClosingCard
          message={
            <Text size="small" weight="bold" color="white">
              {intl.formatMessage(messages.linksExpired)}
            </Text>
          }
          background="status-warning"
          width="full"
          margin={{ bottom: 'small' }}
        />
      )}
      <Box gap="medium">
        {inviteLink && (
          <CopyClipboard
            copyId={`inviteLink-${classroomId}`}
            text={inviteLink}
            title={intl.formatMessage(messages.shareViewerLinkLabel)}
            withLabel={true}
            onSuccess={() => {
              toast(intl.formatMessage(messages.toastCopiedClipboardSuccess), {
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
        {instructorToken && (
          <CopyClipboard
            copyId={`instructorLink-${classroomId}`}
            text={instructorLink}
            title={intl.formatMessage(messages.shareModeratorLinkLabel)}
            withLabel={true}
            onSuccess={() => {
              toast(intl.formatMessage(messages.toastCopiedClipboardSuccess), {
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
        <CopyClipboard
          copyId={`ltiLink-${classroomId}`}
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
      </Box>
    </React.Fragment>
  );
};

export default DashboardCopyClipboard;
