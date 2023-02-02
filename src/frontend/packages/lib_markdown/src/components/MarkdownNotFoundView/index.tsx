import { Box, Heading } from 'grommet';
import { Search } from 'grommet-icons';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = {
  notFound: defineMessages({
    text: {
      defaultMessage:
        'The resource you are looking for is not available. If you are an instructor try to re-authenticate.',
      description:
        'Base "resource not found" text, displayed when no JWT token is provided"',
      id: 'markdown.MarkdownView.notFound.text',
    },
    title: {
      defaultMessage: 'Resource not found',
      description:
        'Base "resource not found" heading, displayed when no JWT token is provided"',
      id: 'markdown.MarkdownView.notFound.title',
    },
  }),
};

export const MarkdownNotFoundView = () => {
  const intl = useIntl();

  return (
    <Box direction="column" justify="evenly">
      <Box margin="auto">
        <Heading>
          <Search size="large" />
          {intl.formatMessage(messages.notFound.title)}
        </Heading>
      </Box>
      <Box margin="auto">{intl.formatMessage(messages.notFound.text)}</Box>
    </Box>
  );
};
