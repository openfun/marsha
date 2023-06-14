import { Maybe } from 'lib-common';
import { Fragment } from 'react';
import { MemoryRouter, Route, RouteProps, Routes } from 'react-router-dom';

const defaultWrapper = (routing: JSX.Element) => routing;

export const wrapInRouter = (
  Component: JSX.Element,
  routes?: RouteProps[],
  componentPath = '/',
  history: Maybe<string[]> = undefined,
  header: React.ReactNode = undefined,
  wrapper: (routing: JSX.Element) => JSX.Element = defaultWrapper,
) => {
  const switchElement = (
    <Fragment>
      {header}
      <Routes>
        {routes &&
          routes.map((routeProps) => (
            <Route
              key={
                Array.isArray(routeProps.path)
                  ? String(routeProps.path[0])
                  : String(routeProps.path || '')
              }
              {...routeProps}
            />
          ))}
        <Route path={componentPath} element={Component} />
      </Routes>
    </Fragment>
  );
  return (
    <MemoryRouter initialEntries={history || [componentPath]} initialIndex={0}>
      {wrapper(switchElement)}
    </MemoryRouter>
  );
};
