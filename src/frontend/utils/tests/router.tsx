import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

export const wrapInRouter = (
  Component: JSX.Element,
  routes?: { path: string; children?: React.ReactNode; element?: React.ReactElement | null;}[],
) => (
  <MemoryRouter>
    <Routes>
      {!routes
        ? null
        : routes.map((routeProps) => (
            <Route key={routeProps.path} {...routeProps} />
          ))}
      <Route path="/" element={Component} />
    </Routes>
  </MemoryRouter>
);
