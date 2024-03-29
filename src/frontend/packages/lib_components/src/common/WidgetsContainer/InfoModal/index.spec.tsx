import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsiveContext } from 'grommet';
import { isFirefox, isIframe } from 'lib-common';
import { render } from 'lib-tests';

import { InfoModal } from '.';

jest.mock('lib-common', () => ({
  ...jest.requireActual('lib-common'),
  isIframe: jest.fn(),
  isFirefox: jest.fn(),
}));
const mockIsFirefox = isFirefox as jest.MockedFunction<typeof isFirefox>;
const mockIsIframe = isIframe as jest.MockedFunction<typeof isIframe>;

const mockModalOnClose = jest.fn();
const genericTitle = 'A generic title';
const genericContent =
  'A generic content, which has for purpose to represent an example of an average string used in this modal. It has too be not too short, but also not too long. The idea is to be the average string the modal will displayed.';

const keyCodes = {
  Escape: 27,
} as any;
function patchKeyEvent(e: { code: string | number }) {
  Object.defineProperty(e, 'keyCode', {
    get: () => keyCodes[e.code] ?? 0,
  });
}

describe('<InfoModal />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    document.addEventListener('keydown', patchKeyEvent, { capture: true });
    mockIsIframe.mockReturnValue(false);
    mockIsFirefox.mockReturnValue(false);
  });

  it('renders the modal and closes it with esc key', async () => {
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

    await userEvent.keyboard('{Escape}');

    expect(mockModalOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders the modal and closes it with close button', async () => {
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

    await userEvent.click(closeButton);

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

    expect(screen.getByTestId('info-modal')).toHaveStyle('margin-top: 200px');
  });

  it('renders the modal above the calling components when inside an iFrame', () => {
    mockIsIframe.mockReturnValue(true);

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

  it('renders the modal on the top if Firefox browser and inside an iFrame', () => {
    mockIsIframe.mockReturnValue(true);
    mockIsFirefox.mockReturnValue(true);

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
