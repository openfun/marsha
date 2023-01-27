import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import { CopyClipboard } from 'lib-components';
import React from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  shareLinkLabel: {
    defaultMessage: 'Invite someone with this link:',
    description: 'Label input shareable link with student.',
    id: 'component.DashboardClassroomInstructor.shareLinkLabel',
  },
  toastCopiedClipboardSuccess: {
    defaultMessage: 'Url copied in clipboard !',
    description: 'Toast message when link copied to clipboard.',
    id: 'component.DashboardClassroomInstructor.toastCopiedClipboardSuccess',
  },
  ltiLinkLabel: {
    defaultMessage: 'LTI link for this classroom:',
    description: 'Label for LTI classroom link.',
    id: 'component.DashboardCopyLtiUrl.ltiLinkLabel',
  },
  ltiLinkCopiedSuccess: {
    defaultMessage: 'Url copied in clipboard !',
    description: 'Toast message when link copied to clipboard.',
    id: 'component.DashboardCopyLtiUrl.ltiLinkCopiedSuccess',
  },
});

interface DashboardCopyClipboardProps {
  inviteToken?: Nullable<string>;
  classroomId: string;
}

const DashboardCopyClipboard = ({
  inviteToken,
  classroomId,
}: DashboardCopyClipboardProps) => {
  const intl = useIntl();

  const inviteLink = inviteToken
    ? `${window.location.origin}/my-contents/classroom/${classroomId}/invite/${inviteToken}`
    : '';
  const ltiLink = `${window.location.origin}/lti/classrooms/${classroomId}`;

  return (
    <Box gap="medium">
      {inviteLink && (
        <CopyClipboard
          copyId={`inviteLink-${classroomId}`}
          text={inviteLink}
          title={intl.formatMessage(messages.shareLinkLabel)}
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
  );
};

export default DashboardCopyClipboard;
