import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'grommet';
import React from 'react';

import { PictureInPictureElement } from '.';

describe('<PictureInPictureElement />', () => {
  it('renders component when not in picture mode', () => {
    const onButtonClick = jest.fn();
    const Compo = () => (
      <Button label="my button label" onClick={onButtonClick} />
    );

    render(
      <PictureInPictureElement>
        <Compo />
      </PictureInPictureElement>,
    );

    userEvent.click(screen.getByRole('button', { name: 'my button label' }));
    expect(onButtonClick).toHaveBeenCalled();
  });

  it('renders component when in picture mode', () => {
    const onButtonClick = jest.fn();
    const Compo = () => (
      <Button label="my button label" onClick={onButtonClick} />
    );

    render(
      <PictureInPictureElement isPicture>
        <Compo />
      </PictureInPictureElement>,
    );

    expect(() =>
      userEvent.click(screen.getByRole('button', { name: 'my button label' })),
    ).toThrow();
    expect(onButtonClick).not.toHaveBeenCalled();
  });

  it('does not render actions when not in picture mode', () => {
    const Compo = () => <Button label="my button label" />;
    const Action = () => <Button label="my action" />;

    render(
      <PictureInPictureElement pictureActions={[<Action />]}>
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
      <PictureInPictureElement isPicture pictureActions={[<Action />]}>
        <Compo />
      </PictureInPictureElement>,
    );

    screen.getByRole('button', { name: 'some action' });
  });
});
