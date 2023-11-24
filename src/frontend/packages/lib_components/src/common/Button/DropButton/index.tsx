import { Popover } from '@openfun/cunningham-react';
import {
  ReactElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Box, BoxProps, ButtonBox } from '@lib-components/common';

export interface DropButtonControlledProps extends BoxProps<'div'> {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export interface DropButtonUncontrolledProps extends BoxProps<'div'> {
  isOpen?: never;
  setIsOpen?: never;
}

export type DropButtonProps = BoxProps<'div'> & {
  button: ReactElement;
  children: React.ReactNode;
  containerProps?: BoxProps<'div'>;
  popoverProps?: BoxProps<'div'>;
} & (DropButtonUncontrolledProps | DropButtonControlledProps);

export const DropButton = ({
  isOpen,
  setIsOpen,
  button,
  children,
  containerProps,
  popoverProps,
  ...buttonProps
}: DropButtonProps) => {
  const [isDropOpen, setIsDropOpen] = useState(isOpen);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const buttonRef = useRef(null);
  const boxRef = useRef<HTMLDivElement>(null);

  /**
   * The Cunningham Popover goes out of the screen if the button is too close to the right,
   * this effect is used to move the popover to the left if it's the case.
   */
  useLayoutEffect(() => {
    const setPopoverRightPosition = () => {
      if (!boxRef.current) {
        return;
      }

      const popover = boxRef.current.getElementsByClassName(
        'c__popover',
      )[0] as HTMLDivElement;

      const popoverBounds = popover.getBoundingClientRect();

      if (popoverBounds.right > window.innerWidth) {
        popover.style.right = '5px';
      }
    };

    const handleWindowResize = () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(setPopoverRightPosition, 1000 / 30);
    };

    window.addEventListener('resize', handleWindowResize);
    setPopoverRightPosition();

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [isDropOpen]);

  useEffect(() => {
    setIsDropOpen(isOpen);
  }, [isOpen]);

  return (
    <Box ref={buttonRef} {...containerProps}>
      <ButtonBox
        onClick={() =>
          setIsOpen ? setIsOpen(!isDropOpen) : setIsDropOpen(!isDropOpen)
        }
        {...buttonProps}
      >
        {button}
      </ButtonBox>
      {isDropOpen && (
        <Box ref={boxRef}>
          <Popover
            parentRef={buttonRef}
            onClickOutside={() =>
              setIsOpen ? setIsOpen(false) : setIsDropOpen(false)
            }
            borderless
          >
            <Box
              background="white"
              pad="2px"
              round="6px"
              elevation
              {...popoverProps}
            >
              {children}
            </Box>
          </Popover>
        </Box>
      )}
    </Box>
  );
};
