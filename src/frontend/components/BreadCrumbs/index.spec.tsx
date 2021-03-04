import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Link, MemoryRouter, Route, Switch } from 'react-router-dom';

import { BreadCrumbs, BreadCrumbsProvider, Crumb } from '.';

describe('<BreadCrumbs />', () => {
  it('picks up the Crumbs from the React tree and displays them in the breadcrumbs', () => {
    render(
      <MemoryRouter initialEntries={['/route-a']}>
        <BreadCrumbsProvider>
          <BreadCrumbs />
          <Link to="/route-a">Link to route A</Link>
          <Link to="/route-b">Link to route B</Link>
          <Link to="/route-b/route-c">Link to route C</Link>
          <Link to="/route-b/route-d">Link to route D</Link>
          <Switch>
            <Route path="/route-a">
              <Crumb title="Parent route A crumb" />
              <h1>Parent route A title</h1>
            </Route>

            <Route path="/route-b">
              <Crumb title="Parent route B crumb" />
              <Switch>
                <Route path="/route-b/route-c">
                  <Crumb title="Child route C crumb" />
                  <h1>Child route C title</h1>
                </Route>

                <Route path="/route-b/route-d">
                  <Crumb title="Child route D crumb" />
                  <h1>Child route D title</h1>
                </Route>

                <Route path="/route-b">
                  <h1>Parent route B title</h1>
                </Route>
              </Switch>
            </Route>
          </Switch>
        </BreadCrumbsProvider>
      </MemoryRouter>,
    );

    // Route A is loaded and appears in crumbs, with no links as it is the current page
    screen.getByRole('heading', { name: 'Parent route A title' });
    expect(
      screen
        .getAllByRole('listitem')
        .filter((item) => item.textContent === 'Parent route A crumb').length,
    ).toEqual(1);
    expect(
      screen.queryByRole('link', { name: 'Parent route A crumb' }),
    ).toBeNull();
    // Crumbs for other routes do not appear on the page
    for (const crumbText of [
      'Parent route B crumb',
      'Child route C crumb',
      'Child route D crumb',
    ]) {
      expect(screen.queryByText(crumbText)).toBeNull();
    }

    // Move to route D, make sure crumbs for routes B and D are shown
    fireEvent.click(screen.getByRole('link', { name: 'Link to route D' }));
    screen.getByRole('heading', { name: 'Child route D title' });
    expect(
      screen.queryByRole('heading', { name: 'Parent route B title' }),
    ).toBeNull();
    screen.getByRole('link', { name: 'Parent route B crumb' });
    expect(
      screen
        .getAllByRole('listitem')
        .filter((item) => item.textContent === 'Child route D crumb').length,
    ).toEqual(1);
    // Crumbs for other routes do not appear on the page
    // Crumbs for other routes do not appear on the page
    for (const crumbText of ['Parent route A crumb', 'Child route C crumb']) {
      expect(screen.queryByText(crumbText)).toBeNull();
    }
  });
});
