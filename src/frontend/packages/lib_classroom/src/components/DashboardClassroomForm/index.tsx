import { Box, Button, Tab, Tabs, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { Classroom } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ClassroomInfoBar } from '@lib-classroom/components/ClassroomInfoBar';
import { ClassroomWidgetProvider } from '@lib-classroom/components/ClassroomWidgetProvider';
import { useCreateClassroomAction } from '@lib-classroom/data/queries';
import { CurrentClassroomProvider } from '@lib-classroom/hooks/useCurrentClassroom';

const StyledClassroomInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
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
  const extendedTheme = {
    tabs: {
      header: {
        extend: `button * { \
          font-size: 16px; \
        }`,
      },
    },
    tab: {
      extend: ` color:${normalizeColor('blue-active', theme)};\
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
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.createClassroomFail));
    },
  });

  return (
    <CurrentClassroomProvider value={classroom}>
      <Box background={{ color: 'bg-marsha' }} fill>
        <StyledClassroomInformationBarWrapper
          align="center"
          background="white"
          direction="row-responsive"
          height={{ min: '80px' }}
          justify="center"
          margin="small"
          pad={{
            vertical: 'small',
            horizontal: 'medium',
          }}
          round="xsmall"
          style={{ flexWrap: 'wrap' }}
        >
          <ClassroomInfoBar flex startDate={classroom.starting_at} />
          <Button
            type="submit"
            label={intl.formatMessage(messages.startClassroomLabel)}
            disabled={!classroom.title}
            primary
            size="small"
            onClick={() => {
              createClassroomMutation.mutate(classroom);
            }}
          />
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
