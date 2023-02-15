import { Button, Box, Text, ResponsiveContext } from 'grommet';
import React, { useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';

import {
  FULL_SCREEN_ERROR_ROUTE,
  modelName,
  useAppConfig,
  withLink,
  WhiteCard,
  WizardLayout,
} from 'lib-components';
import { ConfigureLiveButton, CreateVOD } from 'lib-video';
import { VideoWizzardSubPage, VIDEO_WIZARD_ROUTE } from 'components/routes';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';

const messages = defineMessages({
  chooseActionTitle: {
    defaultMessage: 'What are you willing to do ?',
    description: 'Title asking what actions the user wants to do.',
    id: 'component.VideoWizard.chooseActionTitle',
  },
  descriptionText: {
    defaultMessage:
      'You can choose between creating a video and uploading one, or creating a live, that you will be able to schedule if needed.',
    description: 'A paragraph presenting the actions below.',
    id: 'component.VideoWizard.descriptionText',
  },
  createVideoButtonLabel: {
    defaultMessage: 'Create a video',
    description: 'Label of the button used for creating a new video.',
    id: 'component.VideoWizard.createVideoButtonLabel',
  },
});

const CreateVODButton = withLink(Button);

const VideoWizard = () => {
  const intl = useIntl();
  const history = useHistory();
  const size = useContext(ResponsiveContext);
  const appData = useAppConfig();

  if (!appData.video) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }
  const video = appData.video;

  return (
    <WizardLayout>
      <Switch>
        <Route
          path={VIDEO_WIZARD_ROUTE(VideoWizzardSubPage.createVideo)}
          render={() => (
            <CreateVOD
              video={video}
              onUploadSuccess={() => {
                // If title & license update fails, we still redirect the user to the dashboard
                // because it will know update has failed (react toast) but he will be able
                // to update it using the dashboard
                history.push(DASHBOARD_ROUTE(modelName.VIDEOS));
              }}
              onPreviousButtonClick={() => {
                if (history.length > 1) {
                  history.goBack();
                } else {
                  history.replace(VIDEO_WIZARD_ROUTE());
                }
              }}
            />
          )}
        />

        <WhiteCard title={intl.formatMessage(messages.chooseActionTitle)}>
          <Box
            direction="column"
            gap="medium"
            margin={{ horizontal: size === 'medium' ? 'medium' : 'xlarge' }}
          >
            <Text color="blue-active" size="1rem" textAlign="center">
              {intl.formatMessage(messages.descriptionText)}
            </Text>

            <CreateVODButton
              a11yTitle={intl.formatMessage(messages.createVideoButtonLabel)}
              color="blue-active"
              fill="horizontal"
              label={intl.formatMessage(messages.createVideoButtonLabel)}
              primary
              style={{ minHeight: '50px', fontFamily: 'Roboto-Medium' }}
              title={intl.formatMessage(messages.createVideoButtonLabel)}
              to={VIDEO_WIZARD_ROUTE(VideoWizzardSubPage.createVideo)}
            />

            <ConfigureLiveButton
              video={video}
              RenderOnSuccess={
                <Redirect push to={DASHBOARD_ROUTE(modelName.VIDEOS)} />
              }
              RenderOnError={
                <Redirect push to={FULL_SCREEN_ERROR_ROUTE('liveInit')} />
              }
            />
          </Box>
        </WhiteCard>
      </Switch>
    </WizardLayout>
  );
};

export default VideoWizard;
