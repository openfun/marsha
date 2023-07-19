import {
  InfoWidgetModalProvider,
  WidgetProps,
  WidgetSize,
  WidgetsContainer,
} from 'lib-components';
import React from 'react';

import { DeleteSharedLiveMediaModalProvider } from '@lib-video/hooks/useDeleteSharedLiveMediaModal';
import { DeleteTimedTextTrackUploadModalProvider } from '@lib-video/hooks/useDeleteTimedTextTrackUploadModal';

import { DeleteVideo } from './widgets/DeleteVideo';
import { DescriptionWidget } from './widgets/DescriptionWidget';
import { DownloadVideo } from './widgets/DownloadVideo';
import { LicenseManager } from './widgets/LicenseManager';
import { LiveJoinMode } from './widgets/LiveJoinMode';
import { LivePairing } from './widgets/LivePairing';
import { RetentionDate } from './widgets/RetentionDate';
import { SchedulingAndDescription } from './widgets/SchedulingAndDescription';
import { SharedLiveMedia } from './widgets/SharedLiveMedia';
import { ToolsAndApplications } from './widgets/ToolsAndApplications';
import { Transcripts } from './widgets/Transcripts';
import { UploadClosedCaptions } from './widgets/UploadClosedCaptions';
import { UploadSubtitles } from './widgets/UploadSubtitles';
import { UploadTranscripts } from './widgets/UploadTranscripts';
import { UploadVideo } from './widgets/UploadVideo';
import { VODCreation } from './widgets/VODCreation';
import { VisibilityAndInteraction } from './widgets/VisibilityAndInteraction';
import { WidgetThumbnail } from './widgets/WidgetThumbnail';
import { SharedLiveMediaModalWrapper } from './wrappers/SharedLiveMediaModalWrapper';
import { TimedTrackModalWrapper } from './wrappers/TimedTrackModalWrapper';

enum WidgetType {
  DESCRIPTION = 'DESCRIPTION',
  THUMBNAIL_LIVE = 'THUMBNAIL_LIVE',
  THUMBNAIL_VOD = 'THUMBNAIL_VOD',
  DOWNLOAD_VOD_TEACHER = 'DOWNLOAD_VOD_TEACHER',
  DOWNLOAD_VOD_PUBLIC = 'DOWNLOAD_VOD_PUBLIC',
  UPLOAD_VIDEO = 'UPLOAD_VIDEO',
  UPLOAD_SUBTITLES = 'UPLOAD_SUBTITLES',
  UPLOAD_TRANSCRIPTS = 'UPLOAD_TRANSCRIPTS',
  UPLOAD_CLOSED_CAPTATIONS = 'UPLOAD_CLOSED_CAPTATIONS',
  TOOLS_AND_APPLICATIONS = 'TOOLS_AND_APPLICATIONS',
  VISIBILITY_AND_INTERACTION = 'VISIBILITY_AND_INTERACTION',
  SCHEDULING_AND_DESCRIPTION = 'SCHEDULING_AND_DESCRIPTION',
  LICENSE_MANAGER = 'LICENSE_MANAGER',
  LIVE_PAIRING = 'LIVE_PAIRING',
  VOD_CREATION = 'VOD_CREATION',
  LIVE_JOIN_MODE = 'LIVE_JOIN_MODE',
  SHARED_MEDIA_LIVE_TEACHER = 'SHARED_MEDIA_LIVE_TEACHER',
  SHARED_MEDIA_VOD_TEACHER = 'SHARED_MEDIA_VOD_TEACHER',
  SHARED_MEDIA_VOD_PUBLIC = 'SHARED_MEDIA_VOD_PUBLIC',
  TRANSCRIPTS = 'TRANSCRIPTS',
  RETENTION_DATE = 'RETENTION_DATE',
  DELETE_VIDEO = 'DELETE_VIDEO',
}

const widgetLoader: { [key in WidgetType]: WidgetProps } = {
  [WidgetType.DESCRIPTION]: {
    component: <DescriptionWidget key="description" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.THUMBNAIL_LIVE]: {
    component: <WidgetThumbnail isLive key="widget_thumbnail_live" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.THUMBNAIL_VOD]: {
    component: <WidgetThumbnail isLive={false} key="widget_thumbnail_vod" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.DOWNLOAD_VOD_TEACHER]: {
    component: <DownloadVideo key="download_video" isTeacher />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.DOWNLOAD_VOD_PUBLIC]: {
    component: <DownloadVideo key="download_video" isTeacher={false} />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.UPLOAD_VIDEO]: {
    component: <UploadVideo key="upload_video" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.UPLOAD_SUBTITLES]: {
    component: <UploadSubtitles key="upload_subtitles" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.UPLOAD_TRANSCRIPTS]: {
    component: <UploadTranscripts key="upload_transcripts" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.UPLOAD_CLOSED_CAPTATIONS]: {
    component: <UploadClosedCaptions key="upload_closed_captations" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.TOOLS_AND_APPLICATIONS]: {
    component: <ToolsAndApplications key="tools_and_applications" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.VISIBILITY_AND_INTERACTION]: {
    component: <VisibilityAndInteraction key="visibility_and_interaction" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.SCHEDULING_AND_DESCRIPTION]: {
    component: <SchedulingAndDescription key="scheduling_and_description" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.LIVE_PAIRING]: {
    component: <LivePairing key="live_pairing" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.VOD_CREATION]: {
    component: <VODCreation key="vod_creation" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.LIVE_JOIN_MODE]: {
    component: <LiveJoinMode key="live_join_mode" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.SHARED_MEDIA_LIVE_TEACHER]: {
    component: <SharedLiveMedia key="shared_live_media" isLive isTeacher />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.SHARED_MEDIA_VOD_TEACHER]: {
    component: (
      <SharedLiveMedia key="shared_live_media" isLive={false} isTeacher />
    ),
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.SHARED_MEDIA_VOD_PUBLIC]: {
    component: (
      <SharedLiveMedia
        key="shared_live_media"
        isLive={false}
        isTeacher={false}
      />
    ),
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.TRANSCRIPTS]: {
    component: <Transcripts key="transcripts" />,
    size: WidgetSize.LARGE,
  },
  [WidgetType.LICENSE_MANAGER]: {
    component: <LicenseManager key="license_manager" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.RETENTION_DATE]: {
    component: <RetentionDate key="retention_date" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.DELETE_VIDEO]: {
    component: <DeleteVideo key="delete_video" />,
    size: WidgetSize.DEFAULT,
  },
};

const teacherLiveWidgets: WidgetType[] = [
  WidgetType.TOOLS_AND_APPLICATIONS,
  WidgetType.VOD_CREATION,
  WidgetType.THUMBNAIL_LIVE,
  WidgetType.SCHEDULING_AND_DESCRIPTION,
  WidgetType.VISIBILITY_AND_INTERACTION,
  WidgetType.LIVE_PAIRING,
  WidgetType.LIVE_JOIN_MODE,
  WidgetType.SHARED_MEDIA_LIVE_TEACHER,
  WidgetType.RETENTION_DATE,
  WidgetType.DELETE_VIDEO,
];
const teacherVodWidgets: WidgetType[] = [
  WidgetType.DESCRIPTION,
  WidgetType.UPLOAD_VIDEO,
  WidgetType.VISIBILITY_AND_INTERACTION,
  WidgetType.THUMBNAIL_VOD,
  WidgetType.DOWNLOAD_VOD_TEACHER,
  WidgetType.LICENSE_MANAGER,
  WidgetType.UPLOAD_SUBTITLES,
  WidgetType.UPLOAD_TRANSCRIPTS,
  WidgetType.UPLOAD_CLOSED_CAPTATIONS,
  WidgetType.SHARED_MEDIA_VOD_TEACHER,
  WidgetType.TOOLS_AND_APPLICATIONS,
  WidgetType.RETENTION_DATE,
  WidgetType.DELETE_VIDEO,
];
const publicLiveWidgets: WidgetType[] = [];
const publicVodWidgets: WidgetType[] = [
  WidgetType.TRANSCRIPTS,
  WidgetType.SHARED_MEDIA_VOD_PUBLIC,
];

interface VideoWidgetProviderProps {
  isLive: boolean;
  isTeacher: boolean;
}

export const VideoWidgetProvider = ({
  isLive,
  isTeacher,
}: VideoWidgetProviderProps) => {
  const widgets = isTeacher
    ? (isLive ? teacherLiveWidgets : teacherVodWidgets).map(
        (widgetType) => widgetLoader[widgetType],
      )
    : (isLive ? publicLiveWidgets : publicVodWidgets).map(
        (widgetType) => widgetLoader[widgetType],
      );
  return (
    <InfoWidgetModalProvider value={null}>
      <DeleteSharedLiveMediaModalProvider value={null}>
        <DeleteTimedTextTrackUploadModalProvider value={null}>
          <TimedTrackModalWrapper />
          <SharedLiveMediaModalWrapper />
          <WidgetsContainer>{widgets}</WidgetsContainer>
        </DeleteTimedTextTrackUploadModalProvider>
      </DeleteSharedLiveMediaModalProvider>
    </InfoWidgetModalProvider>
  );
};
