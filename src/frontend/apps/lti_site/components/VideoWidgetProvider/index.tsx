import React from 'react';

import { DeleteSharedLiveMediaModalProvider } from 'data/stores/useDeleteSharedLiveMediaModal';
import { DeleteTimedTextTrackUploadModalProvider } from 'data/stores/useDeleteTimedTextTrackUploadModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';

import { WidgetsContainer } from './WidgetsContainer';
import { DownloadVideo } from './widgets/DownloadVideo';
import { WidgetThumbnail } from './widgets/WidgetThumbnail';
import { SharedLiveMediaModalWrapper } from './wrappers/SharedLiveMediaModalWrapper';
import { TimedTrackModalWrapper } from './wrappers/TimedTrackModalWrapper';
import { TitleAndDescriptionWidget } from './widgets/TitleAndDescriptionWidget';
import { UploadVideo } from './widgets/UploadVideo';
import { UploadSubtitles } from './widgets/UploadSubtitles';
import { UploadTranscripts } from './widgets/UploadTranscripts';
import { UploadClosedCaptions } from './widgets/UploadClosedCaptions';
import { ToolsAndApplications } from './widgets/ToolsAndApplications';
import { VisibilityAndInteraction } from './widgets/VisibilityAndInteraction';
import { SchedulingAndDescription } from './widgets/SchedulingAndDescription';
import { LivePairing } from './widgets/LivePairing';
import { VODCreation } from './widgets/VODCreation';
import { LiveJoinMode } from './widgets/LiveJoinMode';
import { SharedLiveMedia } from './widgets/SharedLiveMedia';
import { TitleAndRecordConfigWidget } from './widgets/TitleAndRecordConfigWidget';
import { Transcripts } from './widgets/Transcripts';

enum WidgetType {
  TITLE_AND_DESCRIPTION = 'TITLE_AND_DESCRIPTION',
  TITLE_AND_RECORD_CONFIG = 'TITLE_AND_RECCORD_CONFIG',
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
  LIVE_PAIRING = 'LIVE_PAIRING',
  VOD_CREATION = 'VOD_CREATION',
  LIVE_JOIN_MODE = 'LIVE_JOIN_MODE',
  SHARED_LIVE_MEDIA = 'SHARED_LIVE_MEDIA',
  TRANSCRIPTS = 'TRANSCRIPTS',
}

export enum WidgetSize {
  DEFAULT = 'default',
  LARGE = 'large',
}

export interface WidgetProps {
  component: React.ReactNode;
  size: WidgetSize;
}

const widgetLoader: { [key in WidgetType]: WidgetProps } = {
  [WidgetType.TITLE_AND_DESCRIPTION]: {
    component: <TitleAndDescriptionWidget key="title_and_description" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.TITLE_AND_RECORD_CONFIG]: {
    component: <TitleAndRecordConfigWidget key="title_and_record_config" />,
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
  [WidgetType.SHARED_LIVE_MEDIA]: {
    component: <SharedLiveMedia key="shared_live_media" />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.TRANSCRIPTS]: {
    component: <Transcripts key="transcripts" />,
    size: WidgetSize.LARGE,
  },
};

const teacherLiveWidgets: WidgetType[] = [
  WidgetType.TOOLS_AND_APPLICATIONS,
  WidgetType.TITLE_AND_RECORD_CONFIG,
  WidgetType.VISIBILITY_AND_INTERACTION,
  WidgetType.SCHEDULING_AND_DESCRIPTION,
  WidgetType.LIVE_PAIRING,
  WidgetType.VOD_CREATION,
  WidgetType.LIVE_JOIN_MODE,
  WidgetType.THUMBNAIL_LIVE,
  WidgetType.SHARED_LIVE_MEDIA,
];
const teacherVodWidgets: WidgetType[] = [
  WidgetType.TITLE_AND_DESCRIPTION,
  WidgetType.UPLOAD_VIDEO,
  WidgetType.VISIBILITY_AND_INTERACTION,
  WidgetType.THUMBNAIL_VOD,
  WidgetType.DOWNLOAD_VOD_TEACHER,
  WidgetType.UPLOAD_SUBTITLES,
  WidgetType.UPLOAD_TRANSCRIPTS,
  WidgetType.UPLOAD_CLOSED_CAPTATIONS,
];
const publicLiveWidgets: WidgetType[] = [];
const publicVodWidgets: WidgetType[] = [
  WidgetType.TRANSCRIPTS,
  WidgetType.DOWNLOAD_VOD_PUBLIC,
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
