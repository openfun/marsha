import { useResponsive } from 'lib-components';
import { PropsWithChildren } from 'react';

import { WhiteCard } from 'components/Cards';

const ContentsHeader = ({ children }: PropsWithChildren<unknown>) => {
  const { breakpoint } = useResponsive();

  return (
    <WhiteCard
      direction={breakpoint === 'xxsmall' ? 'column' : 'row'}
      gap={breakpoint === 'xxsmall' ? 'small' : 'none'}
      justify="space-between"
      align="center"
    >
      {children}
    </WhiteCard>
  );
};

export default ContentsHeader;
