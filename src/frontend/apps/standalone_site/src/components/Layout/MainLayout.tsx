import { Breakpoints, Nullable, colorsTokens } from 'lib-common';
import { Box, BoxProps, useResponsive } from 'lib-components';
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';

interface MainLayoutProps extends BoxProps<'div'> {
  children: React.ReactNode;
  Header: ForwardRefExoticComponent<RefAttributes<Nullable<HTMLDivElement>>>;
  menu?: React.ReactNode;
  footer?: React.ReactNode;
  contentBoxProps?: BoxProps<'div'>;
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
  const { isSmallerBreakpoint, breakpoint } = useResponsive();

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
        <Box
          pad={{
            bottom: 'small',
            top: `${headerHeight}px`,
            horizontal: isSmallerBreakpoint(breakpoint, Breakpoints.smedium)
              ? 'small'
              : 'medium',
          }}
          margin={{ bottom: 'medium' }}
          width={{ min: 'none', width: 'full' }}
          fill
          {...contentBoxProps}
        >
          {children}
        </Box>
      </Box>
      {footer}
    </Box>
  );
};

export default MainLayout;
