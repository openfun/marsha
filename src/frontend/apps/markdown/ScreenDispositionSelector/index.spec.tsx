import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import ScreenDispositionSelector, { ScreenDisposition } from '.';

describe('<ScreenDispositionSelector />', () => {
  it('send disposition changes', async () => {
    const setScreenDisposition = jest.fn();

    // split -> editor only
    const { rerender } = render(
      wrapInIntlProvider(
        <ScreenDispositionSelector
          screenDisposition={ScreenDisposition.splitScreen}
          setScreenDisposition={setScreenDisposition}
        />,
      ),
    );

    userEvent.click(screen.getByTestId('disposition-editor-only'));

    expect(setScreenDisposition).toHaveBeenCalledTimes(1);
    expect(setScreenDisposition).toHaveBeenCalledWith(
      ScreenDisposition.editorOnly,
    );

    // split -> editor only
    rerender(
      wrapInIntlProvider(
        <ScreenDispositionSelector
          screenDisposition={ScreenDisposition.editorOnly}
          setScreenDisposition={setScreenDisposition}
        />,
      ),
    );

    userEvent.click(screen.getByTestId('disposition-split-screen'));

    expect(setScreenDisposition).toHaveBeenCalledTimes(2);
    expect(setScreenDisposition).toHaveBeenLastCalledWith(
      ScreenDisposition.splitScreen,
    );

    // split -> renderer only
    rerender(
      wrapInIntlProvider(
        <ScreenDispositionSelector
          screenDisposition={ScreenDisposition.splitScreen}
          setScreenDisposition={setScreenDisposition}
        />,
      ),
    );

    userEvent.click(screen.getByTestId('disposition-rendering-only'));

    expect(setScreenDisposition).toHaveBeenCalledTimes(3);
    expect(setScreenDisposition).toHaveBeenLastCalledWith(
      ScreenDisposition.renderingOnly,
    );

    // Renderer only -> split
    rerender(
      wrapInIntlProvider(
        <ScreenDispositionSelector
          screenDisposition={ScreenDisposition.renderingOnly}
          setScreenDisposition={setScreenDisposition}
        />,
      ),
    );

    userEvent.click(screen.getByTestId('disposition-split-screen'));

    expect(setScreenDisposition).toHaveBeenCalledTimes(4);
    expect(setScreenDisposition).toHaveBeenLastCalledWith(
      ScreenDisposition.splitScreen,
    );
  });
});
