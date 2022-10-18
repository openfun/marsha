import { Box, Card, CardBody, Grid, Text, Tip } from 'grommet';
import { Group } from 'grommet-icons/icons';
import { Nullable } from 'lib-common';
import { FileDepository } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

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
  addAndSelectContent: () => void;
  newLtiUrl: string;
  items: Nullable<FileDepository[]>;
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
            {intl.formatMessage(messages.addFileDepository)}
          </Text>
        </Card>

        {items?.map((item: FileDepository) => (
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
        ))}
      </Grid>
    </Box>
  );
};
