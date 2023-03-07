import { screen } from '@testing-library/react';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import { ResponsiveContext } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { breakpoints, theme } from 'lib-common';
import { appendUtilsElement, render } from 'lib-tests';
import React, { Fragment } from 'react';

import { useResponsive } from '.';

const fullTheme = deepMerge(theme, {
  global: {
    breakpoints: breakpoints,
  },
});

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

  test('breakpoint hook value mobile', () => {
    const Wrapper: WrapperComponent<Element> = ({ children }: Element) => {
      return appendUtilsElement(<Fragment>{children}</Fragment>, {
        grommetOptions: {
          theme: fullTheme,
          responsiveSize: 'xsmall',
        },
      });
    };

    const { result } = renderHook(() => useResponsive(), {
      wrapper: Wrapper,
    });

    expect(result.current.breakpoint).toBe('xsmall');
    expect(result.current.isDesktop).toBeFalsy();
  });

  test('breakpoint hook value desktop', () => {
    const Wrapper: WrapperComponent<Element> = ({ children }: Element) => {
      return appendUtilsElement(<Fragment>{children}</Fragment>, {
        grommetOptions: {
          theme: fullTheme,
          responsiveSize: 'medium',
        },
      });
    };

    const { result } = renderHook(() => useResponsive(), {
      wrapper: Wrapper,
    });

    expect(result.current.breakpoint).toBe('medium');
    expect(result.current.isDesktop).toBeTruthy();
  });
});
