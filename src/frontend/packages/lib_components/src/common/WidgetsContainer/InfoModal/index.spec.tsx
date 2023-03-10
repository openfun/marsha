import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';
import React from 'react';

import { InfoModal } from '.';

const mockModalOnClose = jest.fn();
const genericTitle = 'A generic title';
const genericContent =
  'A generic content, which has for purpose to represent an example of an average string used in this modal. It has too be not too short, but also not too long. The idea is to be the average string the modal will displayed.';

describe('<InfoModal />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the modal and closes it with esc key', () => {
    render(
      <ResponsiveContext.Provider value="large">
        <InfoModal
          text={genericContent}
          title={genericTitle}
          onModalClose={mockModalOnClose}
        />
      </ResponsiveContext.Provider>,
    );
    screen.getByText(genericTitle);
    screen.getByText(genericContent);
    screen.getByRole('button');

    userEvent.keyboard('{esc}');

    expect(mockModalOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders the modal and closes it with close button', () => {
    render(
      <ResponsiveContext.Provider value="large">
        <InfoModal
          text={genericContent}
          title={genericTitle}
          onModalClose={mockModalOnClose}
        />
      </ResponsiveContext.Provider>,
    );
    screen.getByText(genericTitle);
    screen.getByText(genericContent);
    const closeButton = screen.getByRole('button');

    userEvent.click(closeButton);

    expect(mockModalOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders the modal above the calling components', () => {
    const ref = {
      current: {
        offsetTop: 100,
      },
    };

    render(
      <InfoModal
        text={genericContent}
        title={genericTitle}
        onModalClose={mockModalOnClose}
        refWidget={ref.current as unknown as HTMLDivElement}
      />,
    );

    expect(screen.getByTestId('info-modal')).toHaveStyle('margin-top: -100px');
  });

  it('renders the modal on the top if Firefox browser', () => {
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',
      );
    const ref = {
      current: {
        offsetTop: 100,
      },
    };

    render(
      <InfoModal
        text={genericContent}
        title={genericTitle}
        onModalClose={mockModalOnClose}
        refWidget={ref.current as unknown as HTMLDivElement}
      />,
    );

    expect(screen.getByTestId('info-modal')).toHaveStyle('margin-top: 200px');
  });
});
