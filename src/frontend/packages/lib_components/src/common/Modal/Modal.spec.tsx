import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box, Button } from 'grommet';
import { render } from 'lib-tests';
import { createRef } from 'react';

import Modale, { ModalControlMethods } from './Modal';

describe('<Modale />', () => {
  it('opens the modal on init', async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Box>
        <Button>Open</Button>
        <Modale isOpen onClose={onClose}>
          Some awesome content
        </Modale>
      </Box>,
    );

    screen.getByRole('button', { name: 'Open' });
    screen.getByText('Some awesome content');
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <Box>
        <Button>Open</Button>
        <Modale isOpen={false}>Some awesome content</Modale>
      </Box>,
    );

    await waitForElementToBeRemoved(screen.queryByText('Some awesome content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('populates the ref API', async () => {
    const ref = createRef<ModalControlMethods>();
    const onClose = jest.fn();

    render(
      <Box>
        <Button onClick={() => ref.current?.open()}>Open</Button>
        <Modale controlMethods={ref} onClose={onClose}>
          <Button onClick={() => ref.current?.close()}>Close</Button>
          Some awesome content
        </Modale>
      </Box>,
    );

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByText('Some awesome content')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    (await screen.findByRole('button', { name: 'Close' })).click();

    await waitForElementToBeRemoved(screen.queryByText('Some awesome content'));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await userEvent.click(await screen.findByLabelText('Close the modal'));

    await waitForElementToBeRemoved(screen.queryByText('Some awesome content'));
    expect(onClose).toHaveBeenCalled();
  });
});
