import { Box } from 'grommet';
import {
  BoxLoader,
  Document,
  Heading,
  Live,
  LiveModeType,
  LtiSelectResource,
  Playlist,
  Video,
  selectableBaseResource,
  uploadState,
} from 'lib-components';
import { UseCreateVideoData, initiateLive, useCreateVideo } from 'lib-video';
import React, { ComponentType, Fragment, Suspense, lazy } from 'react';
import { useIntl } from 'react-intl';

import { useCreateDocument } from 'data/queries';

import { SelectContentSection } from '../SelectContentSection';
import { commonMessages } from '../commonMessages';
import { buildContentItems } from '../utils';

interface SelectContentVideoProps {
  addMessage: string;
  title: string;
  playlist: Playlist;
  videos: Video[];
  new_video_url: string;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
  isWebinar: boolean;
}

const SelectContentVideo = ({
  addMessage,
  title,
  playlist,
  videos,
  new_video_url,
  lti_select_form_data,
  setContentItemsValue,
  isWebinar,
}: SelectContentVideoProps) => {
  const useCreateVideoMutation = useCreateVideo({
    onSuccess: async (video, variables) => {
      if (variables.live_type) {
        await initiateLive(video, variables.live_type);
      }
      buildContentItems(
        new_video_url + video.id,
        video.title,
        video.description,
        lti_select_form_data,
        setContentItemsValue,
      );
    },
  });
  return (
    <Box>
      <Box align="center">
        <Heading>{title}</Heading>
      </Box>
      <SelectContentSection
        addMessage={addMessage}
        addAndSelectContent={() => {
          const data: UseCreateVideoData = {
            playlist: playlist.id,
            title: lti_select_form_data?.activity_title,
            description: lti_select_form_data?.activity_description,
          };
          if (isWebinar) {
            data.live_type = LiveModeType.JITSI;
          } else {
            data.upload_state = uploadState.INITIALIZED;
          }
          useCreateVideoMutation.mutate(data);
        }}
        newLtiUrl={new_video_url}
        items={videos}
        lti_select_form_data={lti_select_form_data}
        setContentItemsValue={setContentItemsValue}
      />
    </Box>
  );
};

interface SelectContentDocumentProps {
  playlist: Playlist;
  documents: Document[];
  new_document_url: string;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
}

const SelectContentDocument = ({
  playlist,
  documents,
  new_document_url,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentDocumentProps) => {
  const intl = useIntl();
  const useCreateDocumentMutation = useCreateDocument({
    onSuccess: (document) =>
      buildContentItems(
        new_document_url + document.id,
        document.title,
        document.description,
        lti_select_form_data,
        setContentItemsValue,
      ),
  });

  return (
    <Box>
      <Box align="center">
        <Heading>{intl.formatMessage(commonMessages.titleDocument)}</Heading>
      </Box>
      <SelectContentSection
        addMessage={intl.formatMessage(commonMessages.addDocument)}
        addAndSelectContent={() => {
          useCreateDocumentMutation.mutate({
            playlist: playlist.id,
            title: lti_select_form_data?.activity_title,
            description: lti_select_form_data?.activity_description,
          });
        }}
        newLtiUrl={new_document_url}
        items={documents}
        lti_select_form_data={lti_select_form_data}
        setContentItemsValue={setContentItemsValue}
      />
    </Box>
  );
};

interface SelectContentTargetedResourceProps {
  playlist: Playlist;
  documents?: Document[];
  videos?: Video[];
  webinars?: Live[];
  new_document_url?: string;
  new_video_url?: string;
  new_webinar_url?: string;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
  targeted_resource: LtiSelectResource;
}

export const SelectContentTargetedResource = ({
  playlist,
  documents,
  videos,
  webinars,
  new_document_url,
  new_video_url,
  new_webinar_url,
  lti_select_form_data,
  setContentItemsValue,
  targeted_resource,
}: SelectContentTargetedResourceProps) => {
  const intl = useIntl();

  let content: React.ReactNode;
  switch (targeted_resource) {
    case selectableBaseResource.DOCUMENT:
      content = (
        <SelectContentDocument
          documents={documents || []}
          new_document_url={new_document_url || ''}
          playlist={playlist}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
        />
      );
      break;
    case selectableBaseResource.VIDEO:
      content = (
        <SelectContentVideo
          videos={videos || []}
          new_video_url={new_video_url || ''}
          playlist={playlist}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
          isWebinar={false}
          addMessage={intl.formatMessage(commonMessages.addVideo)}
          title={intl.formatMessage(commonMessages.titleVideo)}
        />
      );
      break;
    case selectableBaseResource.WEBINAR:
      content = (
        <SelectContentVideo
          videos={webinars || []}
          new_video_url={new_webinar_url || ''}
          playlist={playlist}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
          isWebinar={true}
          addMessage={intl.formatMessage(commonMessages.addWebinar)}
          title={intl.formatMessage(commonMessages.titleWebinar)}
        />
      );
      break;
    default:
      const LazyComponent = lazy(
        () =>
          import(
            `apps/${targeted_resource}/components/SelectContent/SelectContentResource`
          ) as Promise<{ default: ComponentType<SelectContentResourceProps> }>,
      );
      content = (
        <Suspense fallback={<BoxLoader />}>
          <LazyComponent
            playlist={playlist}
            lti_select_form_data={lti_select_form_data}
            setContentItemsValue={setContentItemsValue}
          />
        </Suspense>
      );
  }
  return <Fragment>{content}</Fragment>;
};

export interface SelectContentResourceProps {
  playlist: Playlist;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
}
