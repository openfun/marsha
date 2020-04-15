import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';

export const wrapInRouter = (
  Component: JSX.Element,
  routes?: { path: string; render: ({ match }: any) => JSX.Element }[],
) => (
  <MemoryRouter>
    <Switch>
      {!routes
        ? null
        : routes.map((routeProps) => (
            <Route exact key={routeProps.path} {...routeProps} />
          ))}
      <Route path="/" render={() => Component} />
    </Switch>
  </MemoryRouter>
);
