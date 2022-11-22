import { Maybe } from 'lib-common';
import React from 'react';
import { MemoryRouter, Route, RouteProps, Switch } from 'react-router-dom';

export const wrapInRouter = (
  Component: JSX.Element,
  routes?: RouteProps[],
  componentPath = '/',
  history: Maybe<string[]> = undefined,
  header: React.ReactNode = undefined,
) => (
  <MemoryRouter initialEntries={history || [componentPath]} initialIndex={0}>
    {header}
    <Switch>
      {routes &&
        routes.map((routeProps) => (
          <Route
            exact
            key={
              Array.isArray(routeProps.path)
                ? String(routeProps.path[0])
                : String(routeProps.path || '')
            }
            {...routeProps}
          />
        ))}
      <Route path={componentPath}>{Component}</Route>
    </Switch>
  </MemoryRouter>
);
