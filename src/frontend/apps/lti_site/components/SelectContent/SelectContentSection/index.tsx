import { Button } from '@openfun/cunningham-react';
import { Document as DocumentIcon } from 'grommet-icons';
import { Nullable } from 'lib-common';
import {
  Box,
  ContentCard,
  Document,
  Grid,
  PlaySVG,
  Text,
  Video,
  WebinarSVG,
  videoSize,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { buildContentItems } from '../utils';

const messages = defineMessages({
  select: {
    defaultMessage: 'Select {content_title}',
    description: `Title used for a video or a document select.`,
    id: 'components.SelectContent.SelectContentSection.select',
  },
});

type ContentCardContent = Video | Document;
const isVideoGuard = (content: ContentCardContent): content is Video => {
  return (
    (content as Video).thumbnail !== undefined ||
    (content as Video).urls !== undefined
  );
};

const SelectContentCard = ({
  content,
  onClick,
}: {
  content: ContentCardContent;
  onClick: () => void;
}) => {
  const intl = useIntl();

  let thumbnail;
  let header;
  if (isVideoGuard(content)) {
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

    header = (
      <Box
        aria-label="thumbnail"
        role="img"
        width="100%"
        height="150px"
        align="center"
        justify="center"
        background={`
          ${
            thumbnail
              ? `url(${thumbnail}) no-repeat center / cover`
              : `radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)`
          }
        `}
      >
        {content.is_live ? (
          <WebinarSVG width={80} height={80} iconColor="white" />
        ) : (
          <PlaySVG width={80} height={80} iconColor="white" />
        )}
      </Box>
    );
  } else {
    header = (
      <Box
        width="100%"
        height="150px"
        align="center"
        justify="center"
        background="radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)"
      >
        <DocumentIcon size="large" color="white" />
      </Box>
    );
  }

  return (
    <ContentCard
      aria-label={intl.formatMessage(messages.select, {
        content_title: content.title,
      })}
      onClick={onClick}
      header={header}
      title={content.title || ''}
    >
      {content.description && (
        <Text
          size="small"
          truncate={5}
          color="grey"
          title={content.description}
        >
          {content.description}
        </Text>
      )}
    </ContentCard>
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
      <Box margin={{ vertical: 'medium' }}>
        <Button
          icon={<span className="material-icons">add_circle</span>}
          onClick={addAndSelectContent}
          style={{ alignSelf: 'start' }}
        >
          {addMessage}
        </Button>
      </Box>
      <Grid columns="small" gap="small">
        {items?.map(
          (item: Video | Document, index: React.Key | null | undefined) => (
            <SelectContentCard
              content={item}
              key={index}
              onClick={() =>
                buildContentItems(
                  item.lti_url || '',
                  item.title,
                  item.description,
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
