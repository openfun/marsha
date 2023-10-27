import { Button } from '@openfun/cunningham-react';
import { Grid } from 'grommet';
import { Nullable } from 'lib-common';
import {
  Box,
  Classroom,
  ClassroomSVG,
  ContentCard,
  Text,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

const messages = defineMessages({
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
});

const SelectContentCard = ({
  content,
  onClick,
}: {
  content: Classroom;
  onClick: () => void;
}) => {
  const intl = useIntl();

  return (
    <ContentCard
      onClick={onClick}
      a11yTitle={intl.formatMessage(messages.select, { title: content.title })}
      header={
        <Box
          aria-label="thumbnail"
          role="img"
          width="100%"
          height="150px"
          align="center"
          justify="center"
          background="radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)"
        >
          <ClassroomSVG width={80} height={80} iconColor="white" />
        </Box>
      }
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
      <Box margin={{ vertical: 'medium' }}>
        <Button
          icon={<span className="material-icons">add_circle</span>}
          onClick={addAndSelectContent}
          style={{ alignSelf: 'start' }}
        >
          {intl.formatMessage(messages.addClassroom)}
        </Button>
      </Box>
      <Grid columns="small" gap="small">
        {items?.map((item: Classroom) => {
          return (
            <SelectContentCard
              content={item}
              key={item.id}
              onClick={() =>
                buildContentItems(
                  item.lti_url,
                  item.title,
                  item.description,
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
