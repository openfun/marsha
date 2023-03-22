import { ResponsiveContext, ThemeContext, ThemeType } from 'grommet';
import { Breakpoints } from 'lib-common';
import { useCallback, useContext } from 'react';

export const useResponsive = () => {
  const breakpoint = useContext(ResponsiveContext);
  const theme = useContext(ThemeContext) as ThemeType;

  const isSmallerBreakpoint = useCallback(
    (
      breakpointSmaller: Breakpoints | string,
      breakpointBigger: Breakpoints | string,
    ) => {
      const breakpointSmallerValue =
        theme?.global?.breakpoints?.[breakpointSmaller]?.value;
      const breakpointBiggerValue =
        theme?.global?.breakpoints?.[breakpointBigger]?.value;

      if (!breakpointSmallerValue || !breakpointBiggerValue) {
        return false;
      }

      return breakpointSmallerValue < breakpointBiggerValue;
    },
    [theme],
  );

  return {
    isDesktop: !isSmallerBreakpoint(breakpoint, Breakpoints.xsmedium),
    isMobile: isSmallerBreakpoint(breakpoint, Breakpoints.xsmedium),
    breakpoint,
    isSmallerBreakpoint,
  };
};
