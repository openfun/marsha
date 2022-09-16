import { Box, Card, CardBody, Grid, Spinner, Tab, Text, Tip } from 'grommet';
import { Group } from 'grommet-icons/icons';
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

import {
  useCreateFileDepository,
  useSelectFileDepository,
} from 'apps/deposit/data/queries';
import { FileDepository } from 'apps/deposit/types/models';

const messages = defineMessages({
  loadingFileDepositories: {
    defaultMessage: 'Loading file depositories...',
    description:
      'Accessible message for the spinner while loading the file depositories in lti select view.',
    id: 'apps.deposit.SelectContent.loadingFileDepositories',
  },
  addFileDepository: {
    defaultMessage: 'Add a file depository',
    description: `Text displayed on a button to add a new file depository.`,
    id: 'apps.deposit.SelectContent.addFileDepository',
  },
  select: {
    defaultMessage: 'Select {title}',
    description: 'Accessible message for selecting a file depository.',
    id: 'apps.deposit.SelectContent.select',
  },
});

const ContentCard = ({
  content,
  onClick,
}: {
  content: FileDepository;
  onClick: () => void;
}) => {
  const intl = useIntl();

  return (
    <Tip
      content={
        <Box pad="medium">
          <Text>{content.title}</Text>
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
  items: Nullable<FileDepository[]>;
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

        {items?.map((item: FileDepository) => (
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
  const { data: selectFileDepository, status: useSelectFileDepositoryStatus } =
    useSelectFileDepository({});

  const useCreateFileDepositoryMutation = useCreateFileDepository({
    onSuccess: (fileDepository) =>
      selectContent(
        selectFileDepository!.new_url! + fileDepository.id,
        fileDepository.title,
        fileDepository.description,
      ),
  });

  let content: JSX.Element;
  switch (useSelectFileDepositoryStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingFileDepositories} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      content = (
        <SelectContentSection
          addMessage={messages.addFileDepository}
          addAndSelectContent={() => {
            useCreateFileDepositoryMutation.mutate({
              playlist: playlist!.id,
              title: lti_select_form_data?.activity_title,
              description: lti_select_form_data?.activity_description,
            });
          }}
          newLtiUrl={selectFileDepository!.new_url!}
          items={selectFileDepository!.file_depositories!}
          selectContent={selectContent}
        />
      );
      break;
  }

  return <Tab title="FileDepositories">{content}</Tab>;
};

export default SelectContentTab;
