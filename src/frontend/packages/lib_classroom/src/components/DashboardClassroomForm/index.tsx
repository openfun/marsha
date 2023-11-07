import { Button } from '@openfun/cunningham-react';
import { Tab, Tabs, ThemeContext } from 'grommet';
import { colorsTokens } from 'lib-common';
import { Box, Classroom } from 'lib-components';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ClassroomInfoBar } from '@lib-classroom/components/ClassroomInfoBar';
import { ClassroomWidgetProvider } from '@lib-classroom/components/ClassroomWidgetProvider';
import { useCreateClassroomAction } from '@lib-classroom/data/queries';
import { CurrentClassroomProvider } from '@lib-classroom/hooks/useCurrentClassroom';

const StyledClassroomInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${colorsTokens['info-150']};
  box-shadow: 0px 0px 7px 5px ${colorsTokens['info-150']};
`;

const messages = defineMessages({
  createClassroomFail: {
    defaultMessage: 'Classroom not created!',
    description: 'Message when classroom creation failed.',
    id: 'component.DashboardClassroomForm.createClassroomFail',
  },
  titleConfiguration: {
    defaultMessage: 'Configuration',
    description:
      'Title of the tab used to configure the live in capital letters',
    id: 'components.DashboardClassroomForm.titleConfiguration',
  },
  startClassroomLabel: {
    defaultMessage: 'Launch the classroom now in BBB',
    description: 'Label for the button starting the classroom creation in BBB.',
    id: 'component.DashboardClassroomForm.startClassroomLabel',
  },
});

interface DashboardClassroomFormProps {
  classroom: Classroom;
}

const DashboardClassroomForm = ({ classroom }: DashboardClassroomFormProps) => {
  const intl = useIntl();
  const [isCreating, setIsCreating] = useState(false);
  const extendedTheme = {
    tabs: {
      header: {
        extend: `button * { \
          font-size: 16px; \
        }`,
      },
    },
    tab: {
      extend: ` color:${colorsTokens['info-500']};\
        font-family: 'Roboto-Bold';\
        height: 21px;\
        letter-spacing: -0.36px;\
        padding-bottom:35px;\
        padding-left:50px;\
        padding-right:50px;\
        padding-top:15px;\
        text-align: center;\
        text-transform: uppercase; \
        `,
      border: {
        color: 'inherit',
        size: 'medium',
      },
    },
  };

  const createClassroomMutation = useCreateClassroomAction(classroom.id, {
    onSuccess: (data) => {
      toast.success(data.message);
      setIsCreating(false);
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.createClassroomFail));
      setIsCreating(false);
    },
  });

  return (
    <CurrentClassroomProvider value={classroom}>
      <Box background={colorsTokens['primary-100']} fill>
        <StyledClassroomInformationBarWrapper
          align="center"
          background="white"
          direction="row"
          justify="center"
          margin="small"
          pad={{
            vertical: 'small',
            horizontal: 'medium',
          }}
          round="xsmall"
          style={{ flexWrap: 'wrap' }}
          gap="small"
        >
          <ClassroomInfoBar />
          <Button
            disabled={!classroom.title || isCreating}
            onClick={() => {
              setIsCreating(true);
              createClassroomMutation.mutate(classroom);
            }}
            style={{
              alignSelf: 'center',
            }}
          >
            {intl.formatMessage(messages.startClassroomLabel)}
          </Button>
        </StyledClassroomInformationBarWrapper>
        <ThemeContext.Extend value={extendedTheme}>
          <Tabs>
            <Tab title={intl.formatMessage(messages.titleConfiguration)}>
              <ClassroomWidgetProvider />
            </Tab>
          </Tabs>
        </ThemeContext.Extend>
      </Box>
    </CurrentClassroomProvider>
  );
};

export default DashboardClassroomForm;
