import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box, Button, Paragraph } from 'grommet';
import { render } from 'lib-tests';

import { PictureInPictureProvider } from '@lib-video/hooks/usePictureInPicture';

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

  it('renders main element and picture', async () => {
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
    await userEvent.click(screen.getByRole('button', { name: 'main button' }));

    screen.getByText('my picture');
    await expect(() =>
      userEvent.click(screen.getByRole('button', { name: 'picture button' })),
    ).rejects.toThrow(/pointer-events: none/);
  });

  it('renders main element and picture reversed', async () => {
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
    await expect(() =>
      userEvent.click(screen.getByRole('button', { name: 'main button' })),
    ).rejects.toThrow(/pointer-events: none/);

    screen.getByText('my picture');
    await userEvent.click(
      screen.getByRole('button', {
        name: 'picture button',
      }),
      {
        pointerEventsCheck: 0,
      },
    );
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

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
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

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await screen.findByRole('button', { name: 'Show document' });
    expect(
      screen.getByRole('button', { name: 'some action' }),
    ).toBeInTheDocument();
  });
});
