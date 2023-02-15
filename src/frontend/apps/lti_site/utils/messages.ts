import { defineMessages } from 'react-intl';

export const errorMessages = defineMessages({
  liveEnded: {
    defaultMessage: 'This video is deleted and you can no longer watch it.',
    description:
      'Text explaining that a live has been deleted (or a lived has ended without any record).',
    id: 'components.Dashboard.DashboardVideoWrapper.liveEnded',
  },
  videoDeleted: {
    defaultMessage: 'This video is deleted',
    description:
      'Title for a user accessing a deleted video (or a live ended without any record).',
    id: 'components.Dashboard.DashboardVideoWrapper.videoDeleted',
  },
});
