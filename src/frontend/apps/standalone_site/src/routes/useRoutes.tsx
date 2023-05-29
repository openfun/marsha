import { useContentRoutes } from 'features/Contents/';

import { MainRoutes, RouteRequired, routes } from './routes';

type Routes = MainRoutes & {
  CONTENTS: RouteRequired;
};

export const useRoutes = (): Routes => {
  const contentRoutes = useContentRoutes();

  return {
    ...routes,
    ...contentRoutes,
  };
};
