import { Button, Heading, Text } from 'grommet';
import { UploadManager } from 'lib-components';
import { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, Route, Switch, useHistory } from 'react-router-dom';

import { Modal } from 'components/Modal';
import { ContentsHeader } from 'features/Contents';
import { routes } from 'routes';

import VideoCreateForm from './VideoCreateForm';

const messages = defineMessages({
  VideoTitle: {
    defaultMessage: 'Videos',
    description: 'Videos title',
    id: 'features.Contents.features.Video.Create.VideoTitle',
  },
  CreateVideoLabel: {
    defaultMessage: 'Create Video',
    description: 'Text heading create video.',
    id: 'features.Contents.features.Video.Create.CreateVideoLabel',
  },
});

const VideoCreate = () => {
  const intl = useIntl();
  const history = useHistory();

  const videoRoute = routes.CONTENTS.subRoutes.VIDEO;
  const videoPath = videoRoute.path;
  const videoCreatePath = videoRoute.subRoutes?.CREATE?.path || '';

  return (
    <Fragment>
      <ContentsHeader>
        <Text size="large" weight="bold">
          {intl.formatMessage(messages.VideoTitle)}
        </Text>
        <Link to={videoCreatePath}>
          <Button
            primary
            label={intl.formatMessage(messages.CreateVideoLabel)}
          />
        </Link>
      </ContentsHeader>
      <Switch>
        <Route path={videoCreatePath} exact>
          <Modal
            isOpen
            onClose={() => {
              history.push(videoPath);
            }}
          >
            <Heading
              level={2}
              margin={{ top: 'xxsmall' }}
              textAlign="center"
              weight="bold"
            >
              {intl.formatMessage(messages.CreateVideoLabel)}
            </Heading>
            <UploadManager>
              <VideoCreateForm />
            </UploadManager>
          </Modal>
        </Route>
      </Switch>
    </Fragment>
  );
};

export default VideoCreate;
