import { Box, BoxProps } from 'grommet';
import { Nullable, colorsTokens } from 'lib-common';
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';

interface MainLayoutProps extends BoxProps {
  children: React.ReactNode;
  Header: ForwardRefExoticComponent<RefAttributes<Nullable<HTMLDivElement>>>;
  menu?: React.ReactNode;
  footer?: React.ReactNode;
  contentBoxProps?: BoxProps;
}

const MainLayout = ({
  children,
  Header,
  menu,
  footer,
  contentBoxProps,
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
    <Box background={colorsTokens['primary-100']} height={{ min: '100vh' }}>
      <Box direction="row" {...boxProps} height={{ min: '75vh' }}>
        <Header ref={headerBoxRef} />
        {menu}
        <Box flex>
          <Box
            pad={{
              bottom: 'small',
              top: `${headerHeight}px`,
              horizontal: 'medium',
            }}
            margin={{ bottom: 'medium' }}
            {...contentBoxProps}
          >
            {children}
          </Box>
        </Box>
      </Box>
      {footer}
    </Box>
  );
};

export default MainLayout;
