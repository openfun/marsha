import {
  ErrorComponents,
  builderFullScreenErrorRoute,
  modelName,
  useAppConfig,
} from 'lib-components';
import { DashboardVideoWrapper } from 'lib-video';
import { Fragment } from 'react';
import { Navigate } from 'react-router-dom';

import DashboardDocument from 'components/DashboardDocument';
import { LTINav } from 'components/LTINav';
import { DashboardContainer } from 'components/Styled/DashboardContainer';

/** Component. Displays a Dashboard with the state of the video in marsha's pipeline and provides links to
 * the player and to the form to replace the video with another one.
 * Will also be used to manage related tracks such as timed text when they are available.
 */
const Dashboard = () => {
  const appData = useAppConfig();

  let content;
  if (appData.modelName === modelName.DOCUMENTS && appData.document) {
    content = (
      <Fragment>
        <LTINav object={appData.document} />
        <DashboardDocument document={appData.document} />
      </Fragment>
    );
  } else if (appData.modelName === modelName.VIDEOS && appData.video) {
    content = <DashboardVideoWrapper video={appData.video} />;
  } else {
    content = (
      <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />
    );
  }

  return <DashboardContainer>{content}</DashboardContainer>;
};

export default Dashboard;
