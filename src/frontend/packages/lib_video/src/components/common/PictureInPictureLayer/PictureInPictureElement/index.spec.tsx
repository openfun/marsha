import { Button } from '@openfun/cunningham-react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { PictureInPictureElement } from '.';

describe('<PictureInPictureElement />', () => {
  it('renders component when not in picture mode', async () => {
    const onButtonClick = jest.fn();
    const Compo = () => (
      <Button onClick={onButtonClick}>my button label</Button>
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
      <Button onClick={onButtonClick}>my button label</Button>
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
    const Compo = () => <Button>my button label</Button>;
    const Action = () => <Button>my action</Button>;

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
    const Compo = () => <Button>my button label</Button>;
    const Action = () => <Button>some action</Button>;

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
