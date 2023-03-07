import { ResponsiveContext, ThemeContext, ThemeType } from 'grommet';
import { useCallback, useContext } from 'react';

export const useResponsive = () => {
  const breakpoint = useContext(ResponsiveContext);
  const theme = useContext(ThemeContext) as ThemeType;

  const isSmallerBreakpoint = useCallback(
    (breakpointSmaller: string, breakpointBigger: string) => {
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
    isDesktop: !isSmallerBreakpoint(breakpoint, 'xsmedium'),
    breakpoint,
    isSmallerBreakpoint,
  };
};
