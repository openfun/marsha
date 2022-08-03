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

import { useCreate{{cookiecutter.model}}, useSelect{{cookiecutter.model}} } from 'apps/{{cookiecutter.app_name}}/data/queries';
import { {{cookiecutter.model}} } from 'apps/{{cookiecutter.app_name}}/types/models';

const messages = defineMessages({
  loading{{cookiecutter.model_plural}}: {
    defaultMessage: 'Loading {{cookiecutter.model_plural_lower}}...',
    description:
      'Accessible message for the spinner while loading the {{cookiecutter.model_plural_lower}} in lti select view.',
    id: 'apps.{{cookiecutter.app_name}}.SelectContent.loading{{cookiecutter.model_plural}}',
  },
  add{{cookiecutter.model}}: {
    defaultMessage: 'Add a {{cookiecutter.model_lower}}',
    description: `Text displayed on a button to add a new {{cookiecutter.model_lower}}.`,
    id: 'apps.{{cookiecutter.app_name}}.SelectContent.add{{cookiecutter.model}}',
  },
  select: {
    defaultMessage: 'Select {title}',
    description: 'Accessible message for selecting a {{cookiecutter.model_lower}}.',
    id: 'apps.{{cookiecutter.app_name}}.SelectContent.select',
  },
  started: {
    defaultMessage: 'Started',
    description: `Text helper displayed if a {{cookiecutter.model_lower}} is started.`,
    id: 'apps.{{cookiecutter.app_name}}.SelectContent.started',
  },
  notStarted: {
    defaultMessage: 'Not started',
    description: `Text helper displayed if a {{cookiecutter.model_lower}} is not started.`,
    id: 'apps.{{cookiecutter.app_name}}.SelectContent.notStarted',
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
  content: {{cookiecutter.model}};
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
              assertion={true}
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
  items: Nullable<{{cookiecutter.model}}[]>;
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

        {items?.map((item: {{cookiecutter.model}}) => (
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
  const { data: select{{cookiecutter.model}}, status: useSelect{{cookiecutter.model}}Status } =
    useSelect{{cookiecutter.model}}({});

  const useCreate{{cookiecutter.model}}Mutation = useCreate{{cookiecutter.model}}({
    onSuccess: ({{cookiecutter.model_lower}}) =>
      selectContent(
        select{{cookiecutter.model}}!.new_url! + {{cookiecutter.model_lower}}.id,
        {{cookiecutter.model_lower}}.title,
        {{cookiecutter.model_lower}}.description,
      ),
  });

  let content: JSX.Element;
  switch (useSelect{{cookiecutter.model}}Status) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loading{{cookiecutter.model_plural}}} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      content = (
        <SelectContentSection
          addMessage={messages.add{{cookiecutter.model}}}
          addAndSelectContent={() => {
            useCreate{{cookiecutter.model}}Mutation.mutate({
              playlist: playlist!.id,
              title: lti_select_form_data?.activity_title,
              description: lti_select_form_data?.activity_description,
            });
          }}
          newLtiUrl={select{{cookiecutter.model}}!.new_url!}
          items={select{{cookiecutter.model}}!.{{cookiecutter.model_plural_lower}}!}
          selectContent={selectContent}
        />
      );
      break;
  }

  return <Tab title="{{cookiecutter.model_plural}}">{content}</Tab>;
};

export default SelectContentTab;
