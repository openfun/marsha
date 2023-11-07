import { Box, Card, CardBody, Grid, Text, Tip } from 'grommet';
import { Group } from 'grommet-icons/icons';
import { Nullable, colorsTokens } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

import { {{cookiecutter.model}} } from 'lib-components';

const messages = defineMessages({
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
});

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
  items: Nullable<{{cookiecutter.model}}[]>;
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
          background={colorsTokens['greyscale-300']}
          align="center"
          onClick={addAndSelectContent}
        >
          <Text alignSelf="center">{intl.formatMessage(messages.add{{cookiecutter.model}})}</Text>
        </Card>

        {items?.map((item: {{cookiecutter.model}}) => (
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