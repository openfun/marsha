import { screen, fireEvent } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';
import { Fragment } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { featureContentLoader } from 'features/Contents';
import { getFullThemeExtend } from 'styles/theme.extend';

import { useMenu } from '../store/menuStore';

import Burger from './Burger/Burger';
import Menu from './Menu';

const initialStoreState = useMenu.getState();

describe('<Menu />', () => {
  beforeEach(() => {
    useMenu.setState(initialStoreState, true);
  });

  test('renders Menu', () => {
    featureContentLoader([]);

    render(<Menu />, { testingLibraryOptions: { wrapper: BrowserRouter } });
    expect(
      screen.getByRole('menuitem', { name: /My playlists/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /My Contents/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Classrooms/i }),
    ).toBeInTheDocument();
  });

  test('menu opening state', () => {
    render(
      <Fragment>
        <Burger />
        <Menu />
      </Fragment>,
      { testingLibraryOptions: { wrapper: BrowserRouter } },
    );

    const menu = screen.getByRole('menu');
    expect(menu).not.toHaveStyle('margin-left: -18.75rem;');
    fireEvent.click(screen.getByRole('button'));
    expect(menu).toHaveStyle('margin-left: -18.75rem;');
  });

  test('menu responsive small screen', () => {
    render(
      <ResponsiveContext.Provider value="small">
        <Menu />
      </ResponsiveContext.Provider>,
      {
        testingLibraryOptions: { wrapper: BrowserRouter },
        grommetOptions: {
          theme: getFullThemeExtend(),
        },
      },
    );

    const menu = screen.getByRole('menu');
    expect(menu).toHaveStyle('margin-left: -18.75rem;');
    expect(menu).toHaveStyle('position: fixed;');
  });
});
