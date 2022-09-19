import ClipboardJS from 'clipboard';
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Image,
  Tab,
  Tabs,
  Text,
  Tip,
} from 'grommet';
import { Copy, DocumentMissing, DocumentUpload, Monitor } from 'grommet-icons';
import { Icon } from 'grommet-icons/icons';
import { Nullable } from 'lib-common';
import { Loader } from 'lib-components';
import React, { lazy, useEffect, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from 'react-intl';
import styled from 'styled-components';

import { appConfigs } from 'data/appConfigs';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { useCreateDocument, useCreateVideo } from 'data/queries';
import { initiateLive } from 'data/sideEffects/initiateLive';
import { appNames } from 'types/AppData';
import { Document } from 'types/file';
import {
  Live,
  LiveModeType,
  Playlist,
  uploadState,
  Video,
  videoSize,
} from 'types/tracks';

const messages = defineMessages({
  playlistTitle: {
    defaultMessage: 'Playlist {title} ({id})',
    description: 'Title for the current playlist.',
    id: 'component.SelectContent.playlistTitle',
  },
  addVideo: {
    defaultMessage: 'Add a video',
    description: `Text displayed on a button to add a new video.`,
    id: 'components.SelectContent.addVideo',
  },
  addDocument: {
    defaultMessage: 'Add a document',
    description: `Text displayed on a button to add a new document.`,
    id: 'components.SelectContent.addDocument',
  },
  addWebinar: {
    defaultMessage: 'Add a webinar',
    description: `Text displayed on a button to add a new webinar.`,
    id: 'components.SelectContent.addWebinar',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: `Text displayed on a button to cancel content selection.`,
    id: 'components.SelectContent.cancel',
  },
  confirm: {
    defaultMessage: 'Select',
    description: `Text displayed on a button to confirm content selection.`,
    id: 'components.SelectContent.confirm',
  },
  uploaded: {
    defaultMessage: 'Uploaded',
    description: `Text helper displayed if a video or a document is uploaded.`,
    id: 'components.SelectContent.uploaded',
  },
  notUploaded: {
    defaultMessage: 'Not uploaded',
    description: `Text helper displayed if a video or a document is not uploaded.`,
    id: 'components.SelectContent.notUploaded',
  },
  readyToShow: {
    defaultMessage: 'Ready to show',
    description: `Text helper displayed if a video or a document is ready to show to students.`,
    id: 'components.SelectContent.readyToShow',
  },
  notReadyToShow: {
    defaultMessage: 'Not ready to show',
    description: `Text helper displayed if a video or a document is not ready to show to students.`,
    id: 'components.SelectContent.notReadyToShow',
  },
  select: {
    defaultMessage: 'Select {content_title}',
    description: `Title used for a video or a document select.`,
    id: 'components.SelectContent.select',
  },
  titleEdit: {
    defaultMessage: 'LTI Content title',
    description: `Label for LTI title content input.`,
    id: 'components.SelectContent.titleEdit',
  },
  copied: {
    defaultMessage: '{text} copied!',
    description: 'Message displayed when playlist info are copied.',
    id: 'components.SelectContent.copied',
  },
});

const IconBox = styled.span`
  font-size: 70px;
  text-align: center;
  padding: 40px;
`;

const IconStatus = ({
  message,
  GrommetIcon,
  color,
}: {
  message: string;
  GrommetIcon: Icon;
  color: string;
}) => (
  <Box direction="row" gap="small" pad="small">
    <GrommetIcon a11yTitle={message} color={color} />
    <Text>{message}</Text>
  </Box>
);

const AssertedIconStatus = ({
  assertion,
  trueMessage,
  falseMessage,
  TrueIcon,
  FalseIcon,
}: {
  assertion: boolean;
  trueMessage: string;
  falseMessage: string;
  TrueIcon: Icon;
  FalseIcon: Icon;
}) => {
  if (assertion) {
    return (
      <IconStatus
        message={trueMessage}
        GrommetIcon={TrueIcon}
        color="status-ok"
      />
    );
  }

  return (
    <IconStatus
      message={falseMessage}
      GrommetIcon={FalseIcon}
      color="status-error"
    />
  );
};

const ContentCard = ({
  content,
  onClick,
}: {
  content: Video | Document;
  onClick: () => void;
}) => {
  const intl = useIntl();
  const contentTitle = { content_title: content.title };

  let thumbnail;
  if ('thumbnail' in content || 'urls' in content) {
    const thumbnailUrls =
      (content.thumbnail &&
        content.thumbnail.is_ready_to_show &&
        content.thumbnail.urls) ||
      content.urls?.thumbnails;

    if (thumbnailUrls) {
      const resolutions = Object.keys(thumbnailUrls).map(
        (size) => Number(size) as videoSize,
      );
      thumbnail =
        thumbnailUrls && resolutions
          ? thumbnailUrls[resolutions[0]]
          : undefined;
    }
  }

  return (
    <Tip
      content={
        <Box pad="medium">
          <Text>{content.title}</Text>
          <Box gap="small" direction="row" align="end">
            <AssertedIconStatus
              assertion={content.upload_state === 'ready'}
              trueMessage={intl.formatMessage(messages.uploaded)}
              falseMessage={intl.formatMessage(messages.notUploaded)}
              TrueIcon={DocumentUpload}
              FalseIcon={DocumentMissing}
            />
          </Box>

          <Box gap="small" direction="row" align="end">
            <AssertedIconStatus
              assertion={content.is_ready_to_show!}
              trueMessage={intl.formatMessage(messages.readyToShow)}
              falseMessage={intl.formatMessage(messages.notReadyToShow)}
              TrueIcon={Monitor}
              FalseIcon={Monitor}
            />
          </Box>
        </Box>
      }
    >
      <Card
        width="large"
        title={intl.formatMessage(messages.select, contentTitle)}
        onClick={onClick}
      >
        <CardBody height="small">
          {thumbnail ? (
            <Image
              alignSelf="stretch"
              alt={content.title || undefined}
              fit="cover"
              fill="vertical"
              src={thumbnail}
            />
          ) : (
            <IconBox className="icon-file-text2" />
          )}
        </CardBody>
      </Card>
    </Tip>
  );
};

export interface SelectContentSectionProps {
  addMessage: MessageDescriptor;
  addAndSelectContent: () => void;
  newLtiUrl: string;
  items: Nullable<Video[] | Document[]>;
  selectContent: (
    url: string,
    title: Nullable<string>,
    description: Nullable<string>,
  ) => void;
}

export const SelectContentSection = ({
  addMessage,
  addAndSelectContent,
  items,
  selectContent,
}: SelectContentSectionProps) => {
  return (
    <Box>
      <Grid columns="small" gap="small">
        <Card
          height="144px"
          justify="center"
          background="light-3"
          align="center"
          onClick={addAndSelectContent}
        >
          <Text alignSelf="center">
            <FormattedMessage {...addMessage} />
          </Text>
        </Card>

        {items?.map(
          (item: Video | Document, index: React.Key | null | undefined) => (
            <ContentCard
              content={item!}
              key={index}
              onClick={() =>
                selectContent(item!.lti_url!, item!.title, item!.description)
              }
            />
          ),
        )}
      </Grid>
    </Box>
  );
};

interface SelectContentProps {
  playlist?: Playlist;
  documents?: Document[];
  videos?: Video[];
  webinars?: Live[];
  new_document_url?: string;
  new_video_url?: string;
  lti_select_form_action_url: string;
  lti_select_form_data: {
    [key: string]: string;
  };
}

export const SelectContent = ({
  playlist,
  documents,
  videos,
  webinars,
  new_document_url,
  new_video_url,
  lti_select_form_action_url,
  lti_select_form_data,
}: SelectContentProps) => {
  const [contentItemsValue, setContentItemsValue] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const useCreateVideoMutation = useCreateVideo({
    onSuccess: async (video, variables) => {
      if (variables.live_type) {
        await initiateLive(video, variables.live_type);
      }
      selectContent(new_video_url + video.id, video.title, video.description);
    },
  });
  const useCreateDocumentMutation = useCreateDocument({
    onSuccess: (document) =>
      selectContent(
        new_document_url + document.id,
        document.title,
        document.description,
      ),
  });
  const intl = useIntl();
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
      lazy(() => import(`apps/${appName}/components/SelectContentTab`)),
    );
  });

  useEffect(() => {
    if (formRef.current && contentItemsValue) {
      formRef.current.submit();
    }
  }, [contentItemsValue]);

  useEffect(() => {
    const clipboard = new ClipboardJS('.copy');
    clipboard.on('success', (event) => {
      toast.success(intl.formatMessage(messages.copied, { text: event.text }));
    });

    clipboard.on('error', (event) => {
      toast.error(event.text);
    });

    return () => clipboard.destroy();
  }, []);

  interface ContentItemsStructure {
    '@context': string;
    '@graph': {
      '@type': string;
      url: string;
      title?: Nullable<string>;
      text?: Nullable<string>;
      frame: [];
    }[];
  }

  const selectContent = (
    ltiUrl: string,
    title: Nullable<string>,
    description: Nullable<string>,
  ) => {
    const contentItems: ContentItemsStructure = {
      '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
      '@graph': [
        {
          '@type': 'ContentItem',
          url: ltiUrl,
          frame: [],
        },
      ],
    };

    if (title) {
      contentItems['@graph'][0].title = title;
    }
    if (description) {
      contentItems['@graph'][0].text = description;
    }

    if (lti_select_form_data?.activity_title) {
      contentItems['@graph'][0].title = lti_select_form_data?.activity_title;
    }
    if (lti_select_form_data?.activity_description) {
      contentItems['@graph'][0].text =
        lti_select_form_data?.activity_description;
    }

    setContentItemsValue(JSON.stringify(contentItems));
  };

  return (
    <Box pad="medium">
      <Box justify="center" align="center" direction="row">
        <Text role="heading" margin="small">
          <FormattedMessage
            {...messages.playlistTitle}
            values={{ title: playlist?.title, id: playlist?.id }}
          />
          <Button
            aria-label={`copy key ${playlist?.id}`}
            data-clipboard-text={playlist?.id}
            icon={<Copy />}
            className="copy"
          />
        </Text>
      </Box>

      <form
        ref={formRef}
        action={lti_select_form_action_url}
        method="POST"
        encType="application/x-www-form-urlencoded"
      >
        {Object.entries(lti_select_form_data!).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

        <input type="hidden" name="content_items" value={contentItemsValue} />
      </form>

      <Tabs>
        <Tab title="Webinars">
          <SelectContentSection
            addMessage={messages.addWebinar}
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
            selectContent={selectContent}
          />
        </Tab>

        <Tab title="Videos">
          <SelectContentSection
            addMessage={messages.addVideo}
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
            selectContent={selectContent}
          />
        </Tab>

        <Tab title="Documents">
          <SelectContentSection
            addMessage={messages.addDocument}
            addAndSelectContent={() => {
              useCreateDocumentMutation.mutate({
                playlist: playlist!.id,
                title: lti_select_form_data?.activity_title,
                description: lti_select_form_data?.activity_description,
              });
            }}
            newLtiUrl={new_document_url!}
            items={documents!}
            selectContent={selectContent}
          />
        </Tab>

        {appTabs.map((LazyComponent, index) => (
          <Suspense key={index} fallback={<Loader />}>
            <LazyComponent
              lti_select_form_data={lti_select_form_data!}
              playlist={playlist!}
              selectContent={selectContent}
            />
          </Suspense>
        ))}
      </Tabs>
    </Box>
  );
};

export interface SelectContentTabProps {
  playlist: Playlist;
  selectContent: (
    url: string,
    title: Nullable<string>,
    description: Nullable<string>,
  ) => void;
  lti_select_form_data: {
    [key: string]: string;
  };
}
