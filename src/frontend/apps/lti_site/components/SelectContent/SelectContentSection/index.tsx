import { Box, Card, CardBody, Grid, Image, Text, Tip } from 'grommet';
import { DocumentMissing, DocumentUpload, Monitor } from 'grommet-icons';
import { Icon } from 'grommet-icons/icons';
import { Nullable } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Document } from 'types/file';
import { Video, videoSize } from 'lib-components';

import { buildContentItems } from '../utils';

const messages = defineMessages({
  playlistTitle: {
    defaultMessage: 'Playlist {title} ({id})',
    description: 'Title for the current playlist.',
    id: 'component.SelectContent.SelectContentSection.playlistTitle',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: `Text displayed on a button to cancel content selection.`,
    id: 'components.SelectContent.SelectContentSection.cancel',
  },
  confirm: {
    defaultMessage: 'Select',
    description: `Text displayed on a button to confirm content selection.`,
    id: 'components.SelectContent.SelectContentSection.confirm',
  },
  uploaded: {
    defaultMessage: 'Uploaded',
    description: `Text helper displayed if a video or a document is uploaded.`,
    id: 'components.SelectContent.SelectContentSection.uploaded',
  },
  notUploaded: {
    defaultMessage: 'Not uploaded',
    description: `Text helper displayed if a video or a document is not uploaded.`,
    id: 'components.SelectContent.SelectContentSection.notUploaded',
  },
  readyToShow: {
    defaultMessage: 'Ready to show',
    description: `Text helper displayed if a video or a document is ready to show to students.`,
    id: 'components.SelectContent.SelectContentSection.readyToShow',
  },
  notReadyToShow: {
    defaultMessage: 'Not ready to show',
    description: `Text helper displayed if a video or a document is not ready to show to students.`,
    id: 'components.SelectContent.SelectContentSection.notReadyToShow',
  },
  select: {
    defaultMessage: 'Select {content_title}',
    description: `Title used for a video or a document select.`,
    id: 'components.SelectContent.SelectContentSection.select',
  },
  titleEdit: {
    defaultMessage: 'LTI Content title',
    description: `Label for LTI title content input.`,
    id: 'components.SelectContent.SelectContentSection.titleEdit',
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
  addMessage: string;
  addAndSelectContent: () => void;
  newLtiUrl: string;
  items: Nullable<Video[] | Document[]>;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
}

export const SelectContentSection = ({
  addMessage,
  addAndSelectContent,
  items,
  lti_select_form_data,
  setContentItemsValue,
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
          <Text alignSelf="center">{addMessage}</Text>
        </Card>

        {items?.map(
          (item: Video | Document, index: React.Key | null | undefined) => (
            <ContentCard
              content={item!}
              key={index}
              onClick={() =>
                buildContentItems(
                  item!.lti_url!,
                  item!.title,
                  item!.description,
                  lti_select_form_data,
                  setContentItemsValue,
                )
              }
            />
          ),
        )}
      </Grid>
    </Box>
  );
};
