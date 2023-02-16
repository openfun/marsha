import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import { ScreenDisposition, ScreenDispositionSelector } from '.';

describe('<ScreenDispositionSelector />', () => {
  it('send disposition changes', () => {
    const setScreenDisposition = jest.fn();

    // editor -> rendering
    const { rerender } = render(
      <ScreenDispositionSelector
        screenDisposition={ScreenDisposition.editor}
        setScreenDisposition={setScreenDisposition}
      />,
    );

    userEvent.click(screen.getByRole('tab', { name: 'Preview' }));

    expect(setScreenDisposition).toHaveBeenCalledTimes(1);
    expect(setScreenDisposition).toHaveBeenCalledWith(
      ScreenDisposition.rendering,
    );

    // rendering -> editor
    rerender(
      <ScreenDispositionSelector
        screenDisposition={ScreenDisposition.rendering}
        setScreenDisposition={setScreenDisposition}
      />,
    );

    userEvent.click(screen.getByRole('tab', { name: 'Markdown' }));

    expect(setScreenDisposition).toHaveBeenCalledTimes(2);
    expect(setScreenDisposition).toHaveBeenLastCalledWith(
      ScreenDisposition.editor,
    );
  });
});
