import React, { ReactElement } from 'react';

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

enum WidgetType {
  TITLE_AND_DESCRIPTION = 'TITLE_AND_DESCRIPTION',
  TITLE_AND_RECORD_CONFIG = 'TITLE_AND_RECCORD_CONFIG',
  THUMBNAIL_LIVE = 'THUMBNAIL_LIVE',
  THUMBNAIL_VOD = 'THUMBNAIL_VOD',
  DOWNLOAD_VOD = 'DOWNLOAD_VOD',
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
}

const widgetLoader: { [key in WidgetType]: ReactElement } = {
  [WidgetType.TITLE_AND_DESCRIPTION]: (
    <TitleAndDescriptionWidget key="title_and_description" />
  ),
  [WidgetType.TITLE_AND_RECORD_CONFIG]: (
    <TitleAndRecordConfigWidget key="title_and_record_config" />
  ),
  [WidgetType.THUMBNAIL_LIVE]: (
    <WidgetThumbnail isLive key="widget_thumbnail_live" />
  ),
  [WidgetType.THUMBNAIL_VOD]: (
    <WidgetThumbnail isLive={false} key="widget_thumbnail_vod" />
  ),
  [WidgetType.DOWNLOAD_VOD]: <DownloadVideo key="download_video" />,
  [WidgetType.UPLOAD_VIDEO]: <UploadVideo key="upload_video" />,
  [WidgetType.UPLOAD_SUBTITLES]: <UploadSubtitles key="upload_subtitles" />,
  [WidgetType.UPLOAD_TRANSCRIPTS]: (
    <UploadTranscripts key="upload_transcripts" />
  ),
  [WidgetType.UPLOAD_CLOSED_CAPTATIONS]: (
    <UploadClosedCaptions key="upload_closed_captations" />
  ),
  [WidgetType.TOOLS_AND_APPLICATIONS]: (
    <ToolsAndApplications key="tools_and_applications" />
  ),
  [WidgetType.VISIBILITY_AND_INTERACTION]: (
    <VisibilityAndInteraction key="visibility_and_interaction" />
  ),
  [WidgetType.SCHEDULING_AND_DESCRIPTION]: (
    <SchedulingAndDescription key="scheduling_and_description" />
  ),
  [WidgetType.LIVE_PAIRING]: <LivePairing key="live_pairing" />,
  [WidgetType.VOD_CREATION]: <VODCreation key="vod_creation" />,
  [WidgetType.LIVE_JOIN_MODE]: <LiveJoinMode key="live_join_mode" />,
  [WidgetType.SHARED_LIVE_MEDIA]: <SharedLiveMedia key="shared_live_media" />,
};

const liveWidgets: WidgetType[] = [
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
const vodWidgets: WidgetType[] = [
  WidgetType.TITLE_AND_DESCRIPTION,
  WidgetType.UPLOAD_VIDEO,
  WidgetType.THUMBNAIL_VOD,
  WidgetType.DOWNLOAD_VOD,
  WidgetType.UPLOAD_SUBTITLES,
  WidgetType.UPLOAD_TRANSCRIPTS,
  WidgetType.UPLOAD_CLOSED_CAPTATIONS,
];

interface VideoWidgetProviderProps {
  isLive: boolean;
}

export const VideoWidgetProvider = ({ isLive }: VideoWidgetProviderProps) => {
  return (
    <InfoWidgetModalProvider value={null}>
      <DeleteSharedLiveMediaModalProvider value={null}>
        <DeleteTimedTextTrackUploadModalProvider value={null}>
          <TimedTrackModalWrapper />
          <SharedLiveMediaModalWrapper />
          <WidgetsContainer>
            {(isLive ? liveWidgets : vodWidgets).map(
              (widgetType) => widgetLoader[widgetType],
            )}
          </WidgetsContainer>
        </DeleteTimedTextTrackUploadModalProvider>
      </DeleteSharedLiveMediaModalProvider>
    </InfoWidgetModalProvider>
  );
};
