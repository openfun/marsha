import { useResponsive } from 'lib-components';
import { PropsWithChildren } from 'react';

import { WhiteCard } from 'components/Cards';

const ContentsHeader = ({ children }: PropsWithChildren<unknown>) => {
  const { breakpoint } = useResponsive();

  return (
    <WhiteCard
      flex="shrink"
      direction={breakpoint === 'xxsmall' ? 'column' : 'row'}
      gap={breakpoint === 'xxsmall' ? 'small' : 'none'}
      justify="between"
      align="center"
      height={{ min: '5rem' }}
    >
      {children}
    </WhiteCard>
  );
};

export default ContentsHeader;
