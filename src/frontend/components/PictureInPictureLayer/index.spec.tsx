import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box, Button, Paragraph } from 'grommet';
import React from 'react';

import { PictureInPictureLayer } from '.';

describe('<PictureInPictureLayer />', () => {
  it('renders the main element only', () => {
    const MainContent = (
      <Box>
        <Paragraph>main content</Paragraph>
      </Box>
    );

    render(<PictureInPictureLayer mainElement={MainContent} />);

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
      <PictureInPictureLayer
        mainElement={MainContent}
        secondElement={Picture}
      />,
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
      <PictureInPictureLayer
        mainElement={MainContent}
        secondElement={Picture}
        reversed
      />,
    );

    screen.getByText('main content');
    expect(() =>
      userEvent.click(screen.getByRole('button', { name: 'main button' })),
    ).toThrow();

    screen.getByText('my picture');
    userEvent.click(screen.getByRole('button', { name: 'picture button' }));
  });
});
