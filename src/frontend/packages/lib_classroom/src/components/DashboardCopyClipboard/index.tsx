import { CopyClipboard, useCurrentResourceContext } from 'lib-components';
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
});

interface DashboardCopyClipboardProps {
  inviteToken: string;
}

const DashboardCopyClipboard = ({
  inviteToken,
}: DashboardCopyClipboardProps) => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const { isFromWebsite } = context;

  if (!isFromWebsite) {
    return null;
  }

  const inviteLink = `${window.location.href}/invite/${inviteToken}`;

  return (
    <CopyClipboard
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
  );
};

export default DashboardCopyClipboard;
