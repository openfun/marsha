import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { CopyClipboard } from '.';

// Even if its depreciated, it's what is used under-the-hood in the clipboard.js librairy
document.execCommand = jest.fn();

describe('<CopyClipboard />', () => {
  let mockResult = 'not called';
  beforeEach(() => {
    mockResult = 'not called';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('checks the renders and interaction with success', async () => {
    render(
      <CopyClipboard
        copyId="my-id"
        text="my_link.html"
        title="button title"
        withLabel={true}
        onSuccess={() => {
          mockResult = 'success';
        }}
        onError={() => {
          mockResult = 'failure';
        }}
      />,
    );

    const copyButton = screen.getByRole('button', {
      name: 'button title',
    });

    expect(screen.getByText('button title')).toBeInTheDocument();
    expect(copyButton).toBeInTheDocument();
    expect(screen.getByText('my_link.html')).toBeInTheDocument();

    expect(document.execCommand).toHaveBeenCalledTimes(0);
    await userEvent.click(copyButton);
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(mockResult).toBe('success');
  });

  it('checks the component inactive', async () => {
    render(
      <CopyClipboard
        copyId="my-id"
        text="my_link.html"
        title="button title"
        withLabel={true}
        onSuccess={() => {
          mockResult = 'success';
        }}
        onError={() => {
          mockResult = 'failure';
        }}
        isActive={false}
      />,
    );

    expect(screen.getByText('my_link.html')).toHaveStyle({
      color: '#b4cff2',
    });
    await userEvent.click(
      screen.getByRole('button', {
        name: 'button title',
      }),
    );
    expect(document.execCommand).toHaveBeenCalledTimes(0);
    expect(mockResult).toBe('not called');
  });

  it('checks the component without label', () => {
    render(
      <CopyClipboard
        copyId="my-id"
        text="my_link.html"
        title="button title"
        onSuccess={() => {
          mockResult = 'success';
        }}
        onError={() => {
          mockResult = 'failure';
        }}
      />,
    );

    expect(screen.queryByText('button title')).not.toBeInTheDocument();
  });
});
