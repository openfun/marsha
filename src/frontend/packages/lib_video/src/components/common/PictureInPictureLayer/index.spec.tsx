import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box, Button, Paragraph } from 'grommet';
import { render } from 'lib-tests';
import React from 'react';

import { PictureInPictureProvider } from 'hooks/usePictureInPicture';

import { PictureInPictureLayer } from '.';

describe('<PictureInPictureLayer />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main element only', () => {
    const MainContent = (
      <Box>
        <Paragraph>main content</Paragraph>
      </Box>
    );

    render(
      <PictureInPictureProvider value={{ reversed: false }}>
        <PictureInPictureLayer mainElement={MainContent} />
      </PictureInPictureProvider>,
    );

    expect(screen.getByText('main content')).toBeInTheDocument();
  });

  it('renders main element and picture', () => {
    const mockMainButtonClick = jest.fn();
    const MainContent = (
      <Box>
        <Paragraph>main content</Paragraph>
        <Button onClick={mockMainButtonClick}>main button</Button>
      </Box>
    );
    const mockPictureButtonClick = jest.fn();
    const Picture = (
      <Box>
        <Paragraph>my picture</Paragraph>
        <Button onClick={mockPictureButtonClick}>picture button</Button>
      </Box>
    );

    render(
      <PictureInPictureProvider value={{ reversed: false }}>
        <PictureInPictureLayer
          mainElement={MainContent}
          secondElement={Picture}
        />
      </PictureInPictureProvider>,
    );

    screen.getByText('main content');
    userEvent.click(screen.getByRole('button', { name: 'main button' }));

    screen.getByText('my picture');
    expect(() =>
      userEvent.click(screen.getByRole('button', { name: 'picture button' })),
    ).toThrow();
  });

  it('renders main element and picture reversed', () => {
    const mockMainButtonClick = jest.fn();
    const MainContent = (
      <Box>
        <Paragraph>main content</Paragraph>
        <Button onClick={mockMainButtonClick}>main button</Button>
      </Box>
    );
    const mockPictureButtonClick = jest.fn();
    const Picture = (
      <Box>
        <Paragraph>my picture</Paragraph>
        <Button onClick={mockPictureButtonClick}>picture button</Button>
      </Box>
    );

    render(
      <PictureInPictureProvider value={{ reversed: false }}>
        <PictureInPictureLayer
          mainElement={MainContent}
          secondElement={Picture}
          reversed
        />
      </PictureInPictureProvider>,
    );

    screen.getByText('main content');
    expect(() =>
      userEvent.click(screen.getByRole('button', { name: 'main button' })),
    ).toThrow();

    screen.getByText('my picture');
    userEvent.click(screen.getByRole('button', { name: 'picture button' }));
  });

  it('renders the picture with switch action when no actions are provided', async () => {
    const MainContent = (
      <Box>
        <Paragraph>main content</Paragraph>
      </Box>
    );
    const Picture = (
      <Box>
        <Paragraph>my picture</Paragraph>
      </Box>
    );

    render(
      <PictureInPictureProvider value={{ reversed: false }}>
        <PictureInPictureLayer
          mainElement={MainContent}
          secondElement={Picture}
        />
      </PictureInPictureProvider>,
    );

    userEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(
      await screen.findByRole('button', { name: 'Show document' }),
    ).toBeInTheDocument();
  });

  it('renders the picture with switch action added to other actions', async () => {
    const MainContent = (
      <Box>
        <Paragraph>main content</Paragraph>
      </Box>
    );
    const Picture = (
      <Box>
        <Paragraph>my picture</Paragraph>
      </Box>
    );
    const Action = <Button>some action</Button>;

    render(
      <PictureInPictureProvider value={{ reversed: false }}>
        <PictureInPictureLayer
          mainElement={MainContent}
          secondElement={Picture}
          pictureActions={[Action]}
        />
      </PictureInPictureProvider>,
    );

    userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await screen.findByRole('button', { name: 'Show document' });
    expect(
      screen.getByRole('button', { name: 'some action' }),
    ).toBeInTheDocument();
  });
});
