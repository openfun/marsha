import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'grommet';
import { render } from 'lib-tests';

import { PictureInPictureElement } from '.';

describe('<PictureInPictureElement />', () => {
  it('renders component when not in picture mode', async () => {
    const onButtonClick = jest.fn();
    const Compo = () => (
      <Button label="my button label" onClick={onButtonClick} />
    );

    render(
      <PictureInPictureElement>
        <Compo />
      </PictureInPictureElement>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'my button label' }),
    );
    expect(onButtonClick).toHaveBeenCalled();
  });

  it('renders component when in picture mode', async () => {
    const onButtonClick = jest.fn();
    const Compo = () => (
      <Button label="my button label" onClick={onButtonClick} />
    );

    render(
      <PictureInPictureElement isPicture>
        <Compo />
      </PictureInPictureElement>,
    );

    await expect(
      userEvent.click(screen.getByRole('button', { name: 'my button label' })),
    ).rejects.toThrow(/pointer-events: none/);
    expect(onButtonClick).not.toHaveBeenCalled();

    screen.getByTestId('corner-resizer');
  });

  it('does not render actions when not in picture mode', () => {
    const Compo = () => <Button label="my button label" />;
    const Action = () => <Button label="my action" />;

    render(
      <PictureInPictureElement pictureLayer={<Action />}>
        <Compo />
      </PictureInPictureElement>,
    );

    expect(
      screen.queryByRole('button', { name: 'my action' }),
    ).not.toBeInTheDocument();
  });

  it('renders actions when in picture mode', () => {
    const Compo = () => <Button label="my button label" />;
    const Action = () => <Button label="some action" />;

    render(
      <PictureInPictureElement isPicture pictureLayer={<Action />}>
        <Compo />
      </PictureInPictureElement>,
    );

    expect(
      screen.getByRole('button', { name: 'some action' }),
    ).toBeInTheDocument();

    expect(screen.getByTestId('corner-resizer')).toBeInTheDocument();
  });
});
