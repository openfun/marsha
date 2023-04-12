import { Box, BoxProps } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

const colorMenu = normalizeColor('blue-active', theme);

const MainLayoutBox = styled(Box)`
  color: ${colorMenu};
  min-height: 100vh;
`;

interface MainLayoutProps extends BoxProps {
  children: React.ReactNode;
  Header: ForwardRefExoticComponent<RefAttributes<Nullable<HTMLDivElement>>>;
  menu?: React.ReactNode;
}

const MainLayout = ({
  children,
  Header,
  menu,
  ...boxProps
}: MainLayoutProps) => {
  const headerBoxRef = useRef<Nullable<HTMLDivElement>>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!headerBoxRef.current) {
      return;
    }
    const headerBox = headerBoxRef.current;

    const handleHeaderHeightChange = () => {
      if (!headerBoxRef.current) {
        return;
      }

      setHeaderHeight(headerBoxRef.current.offsetHeight + 10);
    };
    const observer = new ResizeObserver(handleHeaderHeightChange);
    observer.observe(headerBox);
    return () => {
      observer.unobserve(headerBox);
    };
  }, []);

  return (
    <MainLayoutBox direction="row" {...boxProps}>
      <Header ref={headerBoxRef} />
      {menu}
      <Box
        flex
        background={{ color: 'bg-marsha' }}
        pad={{
          bottom: 'small',
          top: `${headerHeight}px`,
          horizontal: 'medium',
        }}
      >
        {children}
      </Box>
    </MainLayoutBox>
  );
};

export default MainLayout;
