import { Fragment } from 'react';
import { Navigate } from 'react-router-dom';

import { LTINav } from 'components/LTINav';
import { PlaylistPortability } from 'components/PlaylistPortability';
import { DashboardContainer } from 'components/Styled/DashboardContainer';
import {
  ErrorComponents,
  builderFullScreenErrorRoute,
  modelName,
  useAppConfig,
} from 'lib-components';

const PlaylistPage = () => {
  const appData = useAppConfig();

  let content;
  if (appData.modelName === modelName.DOCUMENTS && appData.document) {
    content = (
      <Fragment>
        <LTINav object={appData.document} />
        <PlaylistPortability object={appData.document} />
      </Fragment>
    );
  } else if (appData.modelName === modelName.VIDEOS && appData.video) {
    content = (
      <Fragment>
        <LTINav object={appData.video} />
        <PlaylistPortability object={appData.video} />
      </Fragment>
    );
  } else {
    content = (
      <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />
    );
  }

  return <DashboardContainer>{content}</DashboardContainer>;
};

export default PlaylistPage;
