import { screen, renderHook } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { theme } from 'lib-common';
import { render, wrapperUtils } from 'lib-tests';

import { useResponsive } from '.';

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
          theme,
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
          theme,
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
          theme,
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
          theme,
        },
      },
    );
    expect(screen.getByText(/My breakpoint is:small/i)).toBeInTheDocument();
    expect(
      screen.getByText(/isSmallerBreakpoint is:false/i),
    ).toBeInTheDocument();
  });

  test('breakpoint hook value mobile', () => {
    const { result } = renderHook(() => useResponsive(), {
      wrapper: wrapperUtils({
        grommetOptions: {
          theme,
          responsiveSize: 'xsmall',
        },
      }),
    });

    expect(result.current.breakpoint).toBe('xsmall');
    expect(result.current.isDesktop).toBeFalsy();
    expect(result.current.isMobile).toBeTruthy();
  });

  test('breakpoint hook value desktop', () => {
    const { result } = renderHook(() => useResponsive(), {
      wrapper: wrapperUtils({
        grommetOptions: {
          theme,
          responsiveSize: 'medium',
        },
      }),
    });

    expect(result.current.breakpoint).toBe('medium');
    expect(result.current.isDesktop).toBeTruthy();
    expect(result.current.isMobile).toBeFalsy();
  });
});
