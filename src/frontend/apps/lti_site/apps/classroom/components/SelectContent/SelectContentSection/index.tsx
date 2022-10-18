import { Box, Card, CardBody, Grid, Text, Tip } from 'grommet';
import { DocumentMissing, DocumentUpload } from 'grommet-icons';
import { Icon, Group } from 'grommet-icons/icons';
import { Nullable } from 'lib-common';
import { Classroom } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

const messages = defineMessages({
  loadingClassrooms: {
    defaultMessage: 'Loading classrooms...',
    description:
      'Accessible message for the spinner while loading the classrooms in lti select view.',
    id: 'apps.classroom.SelectContent.SelectContentSection.loadingClassrooms',
  },
  addClassroom: {
    defaultMessage: 'Add a classroom',
    description: `Text displayed on a button to add a new classroom.`,
    id: 'apps.classroom.SelectContent.SelectContentSection.addClassroom',
  },
  select: {
    defaultMessage: 'Select {title}',
    description: 'Accessible message for selecting a classroom.',
    id: 'apps.classroom.SelectContent.SelectContentSection.select',
  },
  started: {
    defaultMessage: 'Started',
    description: `Text helper displayed if a classroom is started.`,
    id: 'apps.classroom.SelectContent.SelectContentSection.started',
  },
  notStarted: {
    defaultMessage: 'Not started',
    description: `Text helper displayed if a classroom is not started.`,
    id: 'apps.classroom.SelectContent.SelectContentSection.notStarted',
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
  addAndSelectContent: () => void;
  newLtiUrl: string;
  items: Nullable<Classroom[]>;
  lti_select_form_data: SelectContentTabProps['lti_select_form_data'];
  setContentItemsValue: SelectContentTabProps['setContentItemsValue'];
}

export const SelectContentSection = ({
  addAndSelectContent,
  items,
  lti_select_form_data,
  setContentItemsValue,
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
          onClick={addAndSelectContent}
        >
          <Text alignSelf="center">
            {intl.formatMessage(messages.addClassroom)}
          </Text>
        </Card>

        {items?.map((item: Classroom) => {
          return (
            <ContentCard
              content={item!}
              key={item.id}
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
          );
        })}
      </Grid>
    </Box>
  );
};
