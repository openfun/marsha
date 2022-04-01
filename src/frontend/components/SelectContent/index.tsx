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
import React, { lazy, useEffect, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from 'react-intl';
import styled from 'styled-components';

import { Document } from 'types/file';
import { appNames } from 'types/AppData';
import { Playlist, Video, videoSize } from 'types/tracks';
import { Nullable } from 'utils/types';
import { isFeatureEnabled } from 'utils/isFeatureEnabled';
import { Loader } from 'components/Loader';
import { appConfigs } from 'data/appConfigs';

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
  newVideo: {
    defaultMessage: 'New video',
    description: `Default LTI consumer title for a new video.`,
    id: 'components.SelectContent.newVideo',
  },
  newDocument: {
    defaultMessage: 'New document',
    description: `Default LTI consumer title for a new document.`,
    id: 'components.SelectContent.newDocument',
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
  // if ('thumbnail' in content || ('urls' in content && content!.urls)) {
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

interface SelectContentSectionProps {
  addMessage: MessageDescriptor;
  newTitle: MessageDescriptor;
  newLtiUrl: string;
  items: Nullable<Video[] | Document[]>;
  selectContent: (url: string, title: Nullable<string>) => void;
}

export const SelectContentSection = ({
  addMessage,
  newTitle,
  newLtiUrl,
  items,
  selectContent,
}: SelectContentSectionProps) => {
  const intl = useIntl();

  return (
    <Box>
      <Grid columns="small" gap="small">
        <Card
          height="144px"
          justify="center"
          background="light-3"
          align="center"
          onClick={() => selectContent(newLtiUrl, intl.formatMessage(newTitle))}
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
              onClick={() => selectContent(item!.lti_url!, item!.title)}
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
  new_document_url,
  new_video_url,
  lti_select_form_action_url,
  lti_select_form_data,
}: SelectContentProps) => {
  const [contentItemsValue, setContentItemsValue] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const intl = useIntl();

  const appTabs: React.LazyExoticComponent<
    React.ComponentType<SelectContentTabProps>
  >[] = [];
  Object.values(appNames).forEach((appName) => {
    const appConfig = appConfigs[appName];
    if (appConfig?.flag && !isFeatureEnabled(appConfig.flag)) {
      return;
    }

    appTabs.push(lazy(() => import(`../../apps/${appName}/SelectContentTab`)));
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

  const selectContent = (ltiUrl: string, title: Nullable<string>) => {
    const contentItems = {
      '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
      '@graph': [
        {
          '@type': 'ContentItem',
          url: ltiUrl,
          title,
          frame: [],
        },
      ],
    };

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
        <Tab title="Videos">
          <SelectContentSection
            addMessage={messages.addVideo}
            newTitle={messages.newVideo}
            newLtiUrl={new_video_url!}
            items={videos!}
            selectContent={selectContent}
          />
        </Tab>

        <Tab title="Documents">
          <SelectContentSection
            addMessage={messages.addDocument}
            newTitle={messages.newDocument}
            newLtiUrl={new_document_url!}
            items={documents!}
            selectContent={selectContent}
          />
        </Tab>

        <Suspense fallback={<Loader />}>
          {appTabs.map((LazyComponent, index) => (
            <LazyComponent key={index} selectContent={selectContent} />
          ))}
        </Suspense>
      </Tabs>
    </Box>
  );
};

export interface SelectContentTabProps {
  selectContent: (url: string, title: Nullable<string>) => void;
}
