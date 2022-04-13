import { Box, Card, CardBody, Grid, Spinner, Tab, Text, Tip } from 'grommet';
import { DocumentMissing, DocumentUpload } from 'grommet-icons';
import { Icon, Group } from 'grommet-icons/icons';
import React from 'react';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from 'react-intl';

import { ErrorMessage } from 'components/ErrorComponents';
import { SelectContentTabProps } from 'components/SelectContent';
import { Nullable } from 'utils/types';

import { useSelectMeeting } from 'apps/bbb/data/queries';
import { Meeting } from 'apps/bbb/types/models';

const messages = defineMessages({
  loadingMeetings: {
    defaultMessage: 'Loading meetings...',
    description:
      'Accessible message for the spinner while loading the meetings in lti select view.',
    id: 'apps.bbb.SelectContent.loadingMeetings',
  },
  addMeeting: {
    defaultMessage: 'Add a meeting',
    description: `Text displayed on a button to add a new meeting.`,
    id: 'apps.bbb.SelectContent.addMeeting',
  },
  select: {
    defaultMessage: 'Select {title}',
    description: 'Accessible message for selecting a meeting.',
    id: 'apps.bbb.SelectContent.select',
  },
  started: {
    defaultMessage: 'Started',
    description: `Text helper displayed if a meeting is started.`,
    id: 'apps.bbb.SelectContent.started',
  },
  notStarted: {
    defaultMessage: 'Not started',
    description: `Text helper displayed if a meeting is not started.`,
    id: 'apps.bbb.SelectContent.notStarted',
  },
});

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
  content: Meeting;
  onClick: () => void;
}) => {
  const intl = useIntl();

  return (
    <Tip
      content={
        <Box pad="medium">
          <Text>{content.title}</Text>
          <Box gap="small" direction="row" align="end">
            <AssertedIconStatus
              assertion={content.started}
              trueMessage={intl.formatMessage(messages.started)}
              falseMessage={intl.formatMessage(messages.notStarted)}
              TrueIcon={DocumentUpload}
              FalseIcon={DocumentMissing}
            />
          </Box>
        </Box>
      }
    >
      <Card
        width="large"
        title={intl.formatMessage(messages.select, { title: content.title })}
        onClick={onClick}
      >
        <CardBody height="small" align="center" justify="center">
          <Group size="xlarge" />
        </CardBody>
      </Card>
    </Tip>
  );
};

interface SelectContentSectionProps {
  addMessage: MessageDescriptor;
  newLtiUrl: string;
  items: Nullable<Meeting[]>;
  selectContent: (
    url: string,
    title: Nullable<string>,
    description: Nullable<string>,
  ) => void;
}

export const SelectContentSection = ({
  addMessage,
  newLtiUrl,
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
          onClick={() => selectContent(newLtiUrl)}
        >
          <Text alignSelf="center">
            <FormattedMessage {...addMessage} />
          </Text>
        </Card>

        {items?.map((item: Meeting) => (
          <ContentCard
            content={item!}
            key={item.id}
            onClick={() =>
              selectContent(item!.lti_url!, item!.title, item!.description)
            }
          />
        ))}
      </Grid>
    </Box>
  );
};

const SelectContentTab = ({ selectContent }: SelectContentTabProps) => {
  const { data: selectMeeting, status: useSelectMeetingStatus } =
    useSelectMeeting({});

  let content: JSX.Element;
  switch (useSelectMeetingStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingMeetings} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      content = (
        <SelectContentSection
          addMessage={messages.addMeeting}
          newLtiUrl={selectMeeting!.new_url!}
          items={selectMeeting!.meetings!}
          selectContent={selectContent}
        />
      );
      break;
  }

  return <Tab title="Meetings">{content}</Tab>;
};

export default SelectContentTab;
