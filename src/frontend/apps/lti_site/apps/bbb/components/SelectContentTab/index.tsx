import { Box, Card, CardBody, Grid, Spinner, Tab, Text, Tip } from 'grommet';
import { DocumentMissing, DocumentUpload } from 'grommet-icons';
import { Icon, Group } from 'grommet-icons/icons';
import { Nullable } from 'lib-common';
import React from 'react';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from 'react-intl';

import { ErrorMessage } from 'components/ErrorComponents';
import { SelectContentTabProps } from 'components/SelectContent';

import { useCreateClassroom, useSelectClassroom } from 'apps/bbb/data/queries';
import { Classroom } from 'apps/bbb/types/models';

const messages = defineMessages({
  loadingClassrooms: {
    defaultMessage: 'Loading classrooms...',
    description:
      'Accessible message for the spinner while loading the classrooms in lti select view.',
    id: 'apps.bbb.SelectContent.loadingClassrooms',
  },
  addClassroom: {
    defaultMessage: 'Add a classroom',
    description: `Text displayed on a button to add a new classroom.`,
    id: 'apps.bbb.SelectContent.addClassroom',
  },
  select: {
    defaultMessage: 'Select {title}',
    description: 'Accessible message for selecting a classroom.',
    id: 'apps.bbb.SelectContent.select',
  },
  started: {
    defaultMessage: 'Started',
    description: `Text helper displayed if a classroom is started.`,
    id: 'apps.bbb.SelectContent.started',
  },
  notStarted: {
    defaultMessage: 'Not started',
    description: `Text helper displayed if a classroom is not started.`,
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
  content: Classroom;
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
  addAndSelectContent: () => void;
  newLtiUrl: string;
  items: Nullable<Classroom[]>;
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

        {items?.map((item: Classroom) => (
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

const SelectContentTab = ({
  playlist,
  selectContent,
  lti_select_form_data,
}: SelectContentTabProps) => {
  const { data: selectClassroom, status: useSelectClassroomStatus } =
    useSelectClassroom({});

  const useCreateClassroomMutation = useCreateClassroom({
    onSuccess: (classroom) =>
      selectContent(
        selectClassroom!.new_url! + classroom.id,
        classroom.title,
        classroom.description,
      ),
  });

  let content: JSX.Element;
  switch (useSelectClassroomStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingClassrooms} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      content = (
        <SelectContentSection
          addMessage={messages.addClassroom}
          addAndSelectContent={() => {
            useCreateClassroomMutation.mutate({
              playlist: playlist!.id,
              title: lti_select_form_data?.activity_title,
              description: lti_select_form_data?.activity_description,
            });
          }}
          newLtiUrl={selectClassroom!.new_url!}
          items={selectClassroom!.classrooms!}
          selectContent={selectContent}
        />
      );
      break;
  }

  return <Tab title="Classrooms">{content}</Tab>;
};

export default SelectContentTab;
