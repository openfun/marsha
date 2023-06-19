import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import { MdxRenderingOptionsSelector } from '.';

describe('<MdxRenderingOptionsSelector />', () => {
  it('send options change', async () => {
    const setRenderingOptions = jest.fn();

    const { rerender } = render(
      <MdxRenderingOptionsSelector
        renderingOptions={{ useMdx: false }}
        setRenderingOptions={setRenderingOptions}
      />,
    );

    const dropButton = screen.getByRole('button', { name: 'Settings' });
    await userEvent.click(dropButton); // open the menu

    // Toggle MDX
    const toggleMdxButton = screen.getByRole('checkbox', {
      name: 'MDX disabled',
    });
    const toggleMathjaxButton = screen.getByRole('checkbox', {
      name: 'Mathjax disabled',
    });

    screen.getByText('Mathjax disabled');

    await userEvent.click(toggleMdxButton);

    expect(setRenderingOptions).toHaveBeenCalledTimes(1);
    expect(setRenderingOptions).toHaveBeenCalledWith({ useMdx: true });

    rerender(
      <MdxRenderingOptionsSelector
        renderingOptions={{ useMdx: true }}
        setRenderingOptions={setRenderingOptions}
      />,
    );

    screen.getByText('MDX enabled');

    // Toggle Mathjax
    await userEvent.click(toggleMathjaxButton);

    expect(setRenderingOptions).toHaveBeenCalledTimes(2);
    expect(setRenderingOptions).toHaveBeenCalledWith({
      useMdx: true,
      useMathjax: true,
    });

    rerender(
      <MdxRenderingOptionsSelector
        renderingOptions={{ useMdx: true, useMathjax: true }}
        setRenderingOptions={setRenderingOptions}
      />,
    );

    screen.getByText('MDX enabled');
    screen.getByText('Mathjax enabled');

    await userEvent.click(toggleMdxButton);

    expect(setRenderingOptions).toHaveBeenCalledTimes(3);
    expect(setRenderingOptions).toHaveBeenCalledWith({
      useMdx: false,
      useMathjax: true,
    });

    rerender(
      <MdxRenderingOptionsSelector
        renderingOptions={{ useMdx: false, useMathjax: true }}
        setRenderingOptions={setRenderingOptions}
      />,
    );

    screen.getByText('Mathjax enabled');

    await userEvent.click(toggleMathjaxButton);

    expect(setRenderingOptions).toHaveBeenCalledTimes(4);
    expect(setRenderingOptions).toHaveBeenCalledWith({
      useMdx: false,
      useMathjax: false,
    });
  });
});
