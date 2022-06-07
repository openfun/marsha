import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PictureInPictureProvider } from 'data/stores/usePictureInPicture';
import { Box, Button, Paragraph } from 'grommet';
import React from 'react';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { PictureInPictureLayer } from '.';

describe('<PictureInPictureLayer />', () => {
  it('renders the main element only', () => {
    const MainContent = (
      <Box>
        <Paragraph>main content</Paragraph>
      </Box>
    );

    render(
      wrapInIntlProvider(
        <PictureInPictureProvider value={{ reversed: false }}>
          <PictureInPictureLayer mainElement={MainContent} />
        </PictureInPictureProvider>,
      ),
    );

    screen.getByText('main content');
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
      wrapInIntlProvider(
        <PictureInPictureProvider value={{ reversed: false }}>
          <PictureInPictureLayer
            mainElement={MainContent}
            secondElement={Picture}
          />
        </PictureInPictureProvider>,
      ),
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
      wrapInIntlProvider(
        <PictureInPictureProvider value={{ reversed: false }}>
          <PictureInPictureLayer
            mainElement={MainContent}
            secondElement={Picture}
            reversed
          />
        </PictureInPictureProvider>,
      ),
    );

    screen.getByText('main content');
    expect(() =>
      userEvent.click(screen.getByRole('button', { name: 'main button' })),
    ).toThrow();

    screen.getByText('my picture');
    userEvent.click(screen.getByRole('button', { name: 'picture button' }));
  });

  it('renders the picture with switch action when no actions are provided', () => {
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
      wrapInIntlProvider(
        <PictureInPictureProvider value={{ reversed: false }}>
          <PictureInPictureLayer
            mainElement={MainContent}
            secondElement={Picture}
          />
        </PictureInPictureProvider>,
      ),
    );

    screen.getByRole('button', { name: 'Show document' });
  });

  it('renders the picture with switch action added to other actions', () => {
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
    const Action = <Box>some action</Box>;

    render(
      wrapInIntlProvider(
        <PictureInPictureProvider value={{ reversed: false }}>
          <PictureInPictureLayer
            mainElement={MainContent}
            secondElement={Picture}
            pictureActions={[Action]}
          />
        </PictureInPictureProvider>,
      ),
    );

    screen.getByRole('button', { name: 'Show document' });
    screen.getByText('some action');
  });
});
