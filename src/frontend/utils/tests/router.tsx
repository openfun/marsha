import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';

export const wrapInRouter = (
  Component: JSX.Element,
  routes?: { path: string; render: ({ match }: any) => JSX.Element }[],
  componentPath: string = '/',
) => (
  <MemoryRouter initialEntries={[componentPath]} initialIndex={0}>
    <Switch>
      {routes &&
        routes.map((routeProps) => (
          <Route exact key={routeProps.path} {...routeProps} />
        ))}
      <Route path={componentPath}>{Component}</Route>
    </Switch>
  </MemoryRouter>
);
