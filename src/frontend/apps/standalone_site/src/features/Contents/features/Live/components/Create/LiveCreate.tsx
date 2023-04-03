import { Button, Heading, Text } from 'grommet';
import { useResponsive } from 'lib-components';
import { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, Route, Switch, useHistory } from 'react-router-dom';

import { WhiteCard } from 'components/Cards';
import { Modal } from 'components/Modal';
import { routes } from 'routes';

import LiveCreateForm from './LiveCreateForm';

const messages = defineMessages({
  WebinarTitle: {
    defaultMessage: 'Webinars',
    description: 'Webinars title',
    id: 'features.Contents.features.Webinar.Create.WebinarTitle',
  },
  CreateWebinarLabel: {
    defaultMessage: 'Create Webinar',
    description: 'Text heading create webinar.',
    id: 'features.Contents.features.Webinar.Create.CreateWebinarLabel',
  },
});

const LiveCreate = () => {
  const intl = useIntl();
  const { breakpoint } = useResponsive();
  const history = useHistory();

  const liveRoute = routes.CONTENTS.subRoutes.LIVE;
  const livePath = liveRoute.path;
  const liveCreatePath = liveRoute.subRoutes?.CREATE?.path || '';

  return (
    <Fragment>
      <WhiteCard
        flex="shrink"
        direction={breakpoint === 'xxsmall' ? 'column' : 'row'}
        gap={breakpoint === 'xxsmall' ? 'small' : 'none'}
        justify="between"
        align="center"
        height={{ min: '5rem' }}
        margin={{ bottom: 'medium' }}
      >
        <Text size="large" weight="bold">
          {intl.formatMessage(messages.WebinarTitle)}
        </Text>
        <Link to={liveCreatePath}>
          <Button
            primary
            label={intl.formatMessage(messages.CreateWebinarLabel)}
          />
        </Link>
      </WhiteCard>
      <Switch>
        <Route path={liveCreatePath} exact>
          <Modal
            isOpen
            onClose={() => {
              history.push(livePath);
            }}
          >
            <Heading
              level={2}
              margin={{ top: 'xxsmall' }}
              textAlign="center"
              weight="bold"
            >
              {intl.formatMessage(messages.CreateWebinarLabel)}
            </Heading>
            <LiveCreateForm />
          </Modal>
        </Route>
      </Switch>
    </Fragment>
  );
};

export default LiveCreate;
