import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';
import React from 'react';

import { getFullThemeExtend } from 'styles/theme.extend';

import { useResponsive } from './useResponsive';

const fullTheme = getFullThemeExtend();

const TestComponent = ({ breakpointTest }: { breakpointTest: string }) => {
  const { breakpoint, isSmallerBreakpoint } = useResponsive();

  return (
    <div>
      <div>My breakpoint is:{breakpoint}</div>
      <div>
        isSmallerBreakpoint is:
        {isSmallerBreakpoint(breakpointTest, breakpoint) ? 'true' : 'false'}
      </div>
    </div>
  );
};

describe('useResponsive', () => {
  test('responsive value breakpoint smaller', () => {
    render(
      <ResponsiveContext.Provider value="small">
        <TestComponent breakpointTest="xsmall" />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );
    expect(screen.getByText(/My breakpoint is:small/i)).toBeInTheDocument();
    expect(
      screen.getByText(/isSmallerBreakpoint is:true/i),
    ).toBeInTheDocument();
  });

  test('responsive value breakpoint bigger', () => {
    render(
      <ResponsiveContext.Provider value="small">
        <TestComponent breakpointTest="medium" />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );
    expect(screen.getByText(/My breakpoint is:small/i)).toBeInTheDocument();
    expect(
      screen.getByText(/isSmallerBreakpoint is:false/i),
    ).toBeInTheDocument();
  });

  test('responsive value breakpoint identique', () => {
    render(
      <ResponsiveContext.Provider value="xsmall">
        <TestComponent breakpointTest="xsmall" />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );
    expect(screen.getByText(/My breakpoint is:xsmall/i)).toBeInTheDocument();
    expect(
      screen.getByText(/isSmallerBreakpoint is:false/i),
    ).toBeInTheDocument();
  });

  test('responsive value breakpoint value not existing', () => {
    render(
      <ResponsiveContext.Provider value="small">
        <TestComponent breakpointTest="I dont exist" />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );
    expect(screen.getByText(/My breakpoint is:small/i)).toBeInTheDocument();
    expect(
      screen.getByText(/isSmallerBreakpoint is:false/i),
    ).toBeInTheDocument();
  });
});
