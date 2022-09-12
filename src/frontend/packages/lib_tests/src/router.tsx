import { Maybe } from 'lib-common';
import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';

export const wrapInRouter = (
  Component: JSX.Element,
  routes?: { path: string; render: ({ match }: any) => JSX.Element }[],
  componentPath = '/',
  history: Maybe<string[]> = undefined,
  header: React.ReactNode = undefined,
) => (
  <MemoryRouter initialEntries={history || [componentPath]} initialIndex={0}>
    {header}
    <Switch>
      {routes &&
        routes.map((routeProps) => (
          <Route exact key={routeProps.path} {...routeProps} />
        ))}
      <Route path={componentPath}>{Component}</Route>
    </Switch>
  </MemoryRouter>
);
