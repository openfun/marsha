import { Tab, Tabs } from 'grommet';
import {
  Loader,
  appNames,
  Document,
  Live,
  LiveModeType,
  Playlist,
  uploadState,
  Video,
} from 'lib-components';
import { initiateLive, useCreateVideo } from 'lib-video';
import React, { lazy, Suspense } from 'react';
import { useIntl } from 'react-intl';

import { appConfigs } from 'data/appConfigs';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { useCreateDocument } from 'data/queries';

import { commonMessages } from '../commonMessages';
import { SelectContentSection } from '../SelectContentSection';
import { buildContentItems } from '../utils';

export interface SelectContentTabProps {
  playlist: Playlist;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
}

interface SelectContentTabsProps {
  playlist?: Playlist;
  documents?: Document[];
  videos?: Video[];
  webinars?: Live[];
  new_document_url?: string;
  new_video_url?: string;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
}

export const SelectContentTabs = ({
  playlist,
  documents,
  videos,
  webinars,
  new_document_url,
  new_video_url,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabsProps) => {
  const intl = useIntl();
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
  const isFeatureEnabled = useIsFeatureEnabled();

  const appTabs: React.LazyExoticComponent<
    React.ComponentType<SelectContentTabProps>
  >[] = [];
  Object.values(appNames).forEach((appName) => {
    const appConfig = appConfigs[appName];
    if (appConfig?.flag && !isFeatureEnabled(appConfig.flag)) {
      return;
    }
    appTabs.push(
      lazy(
        () =>
          import(`apps/${appName}/components/SelectContent/SelectContentTab`),
      ),
    );
  });

  return (
    <Tabs>
      <Tab title={intl.formatMessage(commonMessages.titleWebinar)}>
        <SelectContentSection
          addMessage={intl.formatMessage(commonMessages.addWebinar)}
          addAndSelectContent={async () => {
            useCreateVideoMutation.mutate({
              playlist: playlist!.id,
              title: lti_select_form_data?.activity_title,
              description: lti_select_form_data?.activity_description,
              live_type: LiveModeType.JITSI,
            });
          }}
          newLtiUrl={new_video_url!}
          items={webinars!}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
        />
      </Tab>
      <Tab title={intl.formatMessage(commonMessages.titleVideo)}>
        <SelectContentSection
          addMessage={intl.formatMessage(commonMessages.addVideo)}
          addAndSelectContent={() => {
            useCreateVideoMutation.mutate({
              playlist: playlist!.id,
              title: lti_select_form_data?.activity_title,
              description: lti_select_form_data?.activity_description,
              upload_state: uploadState.INITIALIZED,
            });
          }}
          newLtiUrl={new_video_url!}
          items={videos!}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
        />
      </Tab>
      <Tab title={intl.formatMessage(commonMessages.titleDocument)}>
        <SelectContentSection
          addMessage={intl.formatMessage(commonMessages.addDocument)}
          addAndSelectContent={() => {
            useCreateDocumentMutation.mutate({
              playlist: playlist!.id,
              title: lti_select_form_data?.activity_title,
              description: lti_select_form_data?.activity_description,
            });
          }}
          newLtiUrl={new_document_url!}
          items={documents!}
          lti_select_form_data={lti_select_form_data}
          setContentItemsValue={setContentItemsValue}
        />
      </Tab>
      {appTabs.map((LazyComponent, index) => (
        <Suspense key={index} fallback={<Loader />}>
          <LazyComponent
            lti_select_form_data={lti_select_form_data!}
            playlist={playlist!}
            setContentItemsValue={setContentItemsValue}
          />
        </Suspense>
      ))}
    </Tabs>
  );
};
