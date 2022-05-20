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

    let clickable = true;
    try {
      userEvent.click(screen.getByRole('button', { name: 'my button label' }));
    } catch (e) {
      clickable = false;
    }
    expect(clickable).toBe(false);
    expect(onButtonClick).not.toHaveBeenCalled();
  });
});
