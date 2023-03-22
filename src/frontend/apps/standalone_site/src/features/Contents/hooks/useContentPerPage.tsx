import { useResponsive } from 'lib-components';

import { ITEM_PER_PAGE } from 'conf/global';

const breakpointContentPerPage = {
  xxsmall: 4,
  xsmall: 6,
  small: 8,
  xsmedium: 10,
  smedium: 12,
  medium: 16,
  large: ITEM_PER_PAGE,
};

const useContentPerPage = () => {
  const { breakpoint } = useResponsive();

  return (
    breakpointContentPerPage[
      breakpoint as keyof typeof breakpointContentPerPage
    ] || ITEM_PER_PAGE
  );
};

export default useContentPerPage;
