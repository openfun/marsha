import { ResponsiveContext } from 'grommet';
import { useContext } from 'react';

export const useResponsive = () => {
  const listSmallerScreen = ['small', 'xsmall', 'xxsmall'];
  const breakpoint = useContext(ResponsiveContext);

  return {
    isDesktop: !listSmallerScreen.includes(breakpoint),
    breakpoint,
  };
};
