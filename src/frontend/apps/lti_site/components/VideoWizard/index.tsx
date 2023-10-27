import { Button } from '@openfun/cunningham-react';
import { Breakpoints } from 'lib-common';
import {
  Box,
  ErrorComponents,
  Text,
  WhiteCard,
  WizardLayout,
  builderDashboardRoute,
  builderFullScreenErrorRoute,
  modelName,
  useAppConfig,
  useResponsive,
  withLink,
} from 'lib-components';
import { ConfigureLiveButton, CreateVOD } from 'lib-video';
import { defineMessages, useIntl } from 'react-intl';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import {
  VIDEO_WIZARD_ROUTE,
  VideoWizzardSubPage,
  builderVideoWizzardRoute,
} from 'components/routes';

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
  const navigate = useNavigate();
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const { video } = useAppConfig();

  if (!video) {
    return (
      <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />
    );
  }

  return (
    <WizardLayout>
      <Routes>
        <Route
          path={VIDEO_WIZARD_ROUTE.createVideo}
          element={
            <CreateVOD
              video={video}
              onUploadSuccess={() => {
                // If title & license update fails, we still redirect the user to the dashboard
                // because it will know update has failed (react toast) but he will be able
                // to update it using the dashboard
                navigate(builderDashboardRoute(modelName.VIDEOS));
              }}
              onPreviousButtonClick={() => {
                if (history.length > 1) {
                  navigate('..');
                } else {
                  navigate(builderVideoWizzardRoute());
                }
              }}
            />
          }
        />
        <Route
          path="*"
          element={
            <WhiteCard title={intl.formatMessage(messages.chooseActionTitle)}>
              <Box
                gap="medium"
                margin={{
                  horizontal: isSmallerBreakpoint(breakpoint, Breakpoints.large)
                    ? 'medium'
                    : 'xlarge',
                }}
              >
                <Text textAlign="center">
                  {intl.formatMessage(messages.descriptionText)}
                </Text>

                <CreateVODButton
                  aria-label={intl.formatMessage(
                    messages.createVideoButtonLabel,
                  )}
                  fullWidth
                  title={intl.formatMessage(messages.createVideoButtonLabel)}
                  to={builderVideoWizzardRoute(VideoWizzardSubPage.createVideo)}
                >
                  {intl.formatMessage(messages.createVideoButtonLabel)}
                </CreateVODButton>

                <ConfigureLiveButton
                  video={video}
                  RenderOnSuccess={
                    <Navigate to={builderDashboardRoute(modelName.VIDEOS)} />
                  }
                  RenderOnError={
                    <Navigate
                      to={builderFullScreenErrorRoute(ErrorComponents.liveInit)}
                    />
                  }
                />
              </Box>
            </WhiteCard>
          }
        />
      </Routes>
    </WizardLayout>
  );
};

export default VideoWizard;
