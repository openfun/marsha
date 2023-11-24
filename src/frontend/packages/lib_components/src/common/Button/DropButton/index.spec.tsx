import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import { Fragment, useEffect, useRef, useState } from 'react';

import { Box, Text } from '@lib-components/common';

import { DropButton } from '.';

describe('<DropButton />', () => {
  it('displays and interacts correctly when uncontrolled', async () => {
    render(
      <Fragment>
        <DropButton button={<Fragment>My button</Fragment>}>My Drop</DropButton>
        <button>Click out</button>
      </Fragment>,
    );

    const button = screen.getByRole('button', { name: 'My button' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('My Drop')).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByText('My Drop')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Click out' }));
    expect(screen.queryByText('My Drop')).not.toBeInTheDocument();
  });

  it('displays and interacts correctly when controlled', async () => {
    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <Fragment>
          <DropButton
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            button={<Fragment>My button</Fragment>}
          >
            My Drop
          </DropButton>
          <Text>I am {isOpen ? 'opened' : 'not opened'}</Text>
          <button>Click out</button>
        </Fragment>
      );
    };

    render(<TestComponent />);

    const button = screen.getByRole('button', { name: 'My button' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('I am not opened')).toBeInTheDocument();
    expect(screen.queryByText('My Drop')).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByText('My Drop')).toBeInTheDocument();
    expect(screen.getByText('I am opened')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Click out' }));
    expect(screen.queryByText('My Drop')).not.toBeInTheDocument();
    expect(screen.getByText('I am not opened')).toBeInTheDocument();
  });

  it('replaces the popover when too much on the right side', async () => {
    window.HTMLElement.prototype.getBoundingClientRect = () =>
      ({
        right: window.innerWidth + 1,
      }) as DOMRect;

    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [isPopoverRight, setIsPopoverRight] = useState(false);
      const boxRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        const setPopoverRightPosition = () => {
          if (!boxRef.current) {
            return;
          }

          // eslint-disable-next-line testing-library/no-node-access
          const popover = boxRef.current?.getElementsByClassName(
            'c__popover',
          )[0] as HTMLDivElement;

          if (popover) {
            setIsPopoverRight(!!popover.style.right);
          }
        };

        setTimeout(setPopoverRightPosition, 150);
      }, [isOpen]);

      return (
        <Box ref={boxRef}>
          <DropButton
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            button={<Fragment>My button</Fragment>}
          >
            My Drop
          </DropButton>
          {isPopoverRight && <Text>The popover is replaced to the right</Text>}
        </Box>
      );
    };

    render(<TestComponent />);

    const button = screen.getByRole('button', { name: 'My button' });
    expect(
      screen.queryByText('The popover is replaced to the right'),
    ).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(
      await screen.findByText('The popover is replaced to the right'),
    ).toBeInTheDocument();
  });
});
