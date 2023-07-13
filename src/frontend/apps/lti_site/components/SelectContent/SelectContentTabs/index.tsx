import { Box, Grommet, Tab, Tabs, Text } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { Document as DocumentIcon } from 'grommet-icons';
import { theme as baseTheme } from 'lib-common';
import {
  Document,
  Live,
  LiveModeType,
  Loader,
  PlaySVG,
  Playlist,
  Video,
  WebinarSVG,
  appNames,
  flags,
  uploadState,
} from 'lib-components';
import { initiateLive, useCreateVideo } from 'lib-video';
import React, { ComponentType, Suspense, lazy } from 'react';
import { useIntl } from 'react-intl';

import { appConfigs } from 'data/appConfigs';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { useCreateDocument } from 'data/queries';

import { SelectContentSection } from '../SelectContentSection';
import { commonMessages } from '../commonMessages';
import { buildContentItems } from '../utils';

const customTheme = deepMerge(baseTheme, {
  tab: {
    active: {
      background: 'bg-menu-hover',
      color: 'blue-active',
    },
    border: undefined,
    color: 'blue-active',
    margin: 'none',
    pad: '6px 12px',
    extend: 'border-radius: 6px;',
  },
});

export interface SelectContentTabProps {
  playlist: Playlist;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
}

export interface RichTabTitleProps {
  icon: JSX.Element;
  label: string;
}

export const RichTabTitle = ({ icon, label }: RichTabTitleProps) => (
  <Box direction="row" align="center">
    {icon}
    <Text
      size="0.938rem"
      color="blue-active"
      margin={{ left: 'xsmall' }}
      weight="bold"
    >
      {label}
    </Text>
  </Box>
);

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
        `${new_video_url || ''}${video.id}`,
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
        `${new_document_url || ''}${document.id}`,
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
          import(
            `apps/${appName}/components/SelectContent/SelectContentTab`
          ) as Promise<{ default: ComponentType<SelectContentTabProps> }>,
      ),
    );
  });

  // Grommet Tabs component does not support dynamic tabs, so we need to
  // calculate the initial active tab based on the feature flags, and use a
  // controlled Tabs component to update the active tab.
  let initialActiveTab: number;
  if (isFeatureEnabled(flags.WEBINAR)) {
    initialActiveTab = 0;
  } else if (isFeatureEnabled(flags.VIDEO)) {
    initialActiveTab = 1;
  } else if (isFeatureEnabled(flags.DOCUMENT)) {
    initialActiveTab = 2;
  } else {
    initialActiveTab = 3;
  }
  const [activeTab, setActiveTab] = React.useState(initialActiveTab);
  const onTabChange = (nextTab: number) => setActiveTab(nextTab);

  return (
    <Grommet theme={customTheme}>
      <Tabs activeIndex={activeTab} onActive={onTabChange}>
        {isFeatureEnabled(flags.WEBINAR) && (
          <Tab
            title={
              <RichTabTitle
                icon={
                  <WebinarSVG width={30} height={30} iconColor="blue-active" />
                }
                label={intl.formatMessage(commonMessages.titleWebinar)}
              />
            }
          >
            <SelectContentSection
              addMessage={intl.formatMessage(commonMessages.addWebinar)}
              addAndSelectContent={() => {
                useCreateVideoMutation.mutate({
                  playlist: playlist?.id || '',
                  title: lti_select_form_data?.activity_title,
                  description: lti_select_form_data?.activity_description,
                  live_type: LiveModeType.JITSI,
                });
              }}
              newLtiUrl={new_video_url || ''}
              items={webinars || null}
              lti_select_form_data={lti_select_form_data}
              setContentItemsValue={setContentItemsValue}
            />
          </Tab>
        )}
        {isFeatureEnabled(flags.VIDEO) && (
          <Tab
            title={
              <RichTabTitle
                icon={
                  <PlaySVG width={30} height={30} iconColor="blue-active" />
                }
                label={intl.formatMessage(commonMessages.titleVideo)}
              />
            }
          >
            <SelectContentSection
              addMessage={intl.formatMessage(commonMessages.addVideo)}
              addAndSelectContent={() => {
                useCreateVideoMutation.mutate({
                  playlist: playlist?.id || '',
                  title: lti_select_form_data?.activity_title,
                  description: lti_select_form_data?.activity_description,
                  upload_state: uploadState.INITIALIZED,
                });
              }}
              newLtiUrl={new_video_url || ''}
              items={videos || null}
              lti_select_form_data={lti_select_form_data}
              setContentItemsValue={setContentItemsValue}
            />
          </Tab>
        )}
        {isFeatureEnabled(flags.DOCUMENT) && (
          <Tab
            title={
              <RichTabTitle
                icon={
                  <DocumentIcon
                    a11yTitle=""
                    size="medium"
                    color="blue-active"
                  />
                }
                label={intl.formatMessage(commonMessages.titleDocument)}
              />
            }
          >
            <SelectContentSection
              addMessage={intl.formatMessage(commonMessages.addDocument)}
              addAndSelectContent={() => {
                useCreateDocumentMutation.mutate({
                  playlist: playlist?.id || '',
                  title: lti_select_form_data?.activity_title,
                  description: lti_select_form_data?.activity_description,
                });
              }}
              newLtiUrl={new_document_url || ''}
              items={documents || null}
              lti_select_form_data={lti_select_form_data}
              setContentItemsValue={setContentItemsValue}
            />
          </Tab>
        )}
        {appTabs.map((LazyComponent, index) => (
          <Suspense key={index} fallback={<Loader />}>
            {playlist && (
              <LazyComponent
                lti_select_form_data={lti_select_form_data}
                playlist={playlist}
                setContentItemsValue={setContentItemsValue}
              />
            )}
          </Suspense>
        ))}
      </Tabs>
    </Grommet>
  );
};
