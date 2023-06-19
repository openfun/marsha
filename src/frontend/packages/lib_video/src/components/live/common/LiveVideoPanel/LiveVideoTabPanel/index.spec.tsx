/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { cleanup, screen } from '@testing-library/react';
import { Tabs } from 'grommet';
import {
  participantMockFactory,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { imageSnapshot, render, wrapInIntlProvider } from 'lib-tests';
import renderer from 'react-test-renderer';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LiveVideoTabPanel } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: () => [{ permissions: { can_update: true } }],
}));

describe('<LiveVideoTabPanel /> titles', () => {
  it('renders for item in LivePanelItem', () => {
    const tabTitles = {
      [LivePanelItem.APPLICATION]: 'application',
      [LivePanelItem.CHAT]: 'chat',
      [LivePanelItem.VIEWERS_LIST]: 'viewers',
    };

    for (const itemStr in LivePanelItem) {
      if (typeof itemStr !== 'string') {
        continue;
      }

      const item = itemStr as LivePanelItem;

      render(
        wrapInVideo(
          <Tabs>
            <LiveVideoTabPanel item={item} selected={false} />
          </Tabs>,
          videoMockFactory(),
        ),
      );

      expect(
        screen.getByRole('tab', { name: tabTitles[item] }),
      ).toBeInTheDocument();
      screen.getByText(tabTitles[item]);

      cleanup();

      render(
        wrapInVideo(
          <Tabs>
            <LiveVideoTabPanel item={item} selected={true} />
          </Tabs>,
          videoMockFactory(),
        ),
      );

      screen.getByRole('tab', { name: tabTitles[item] });
      screen.getByText(tabTitles[item]);

      cleanup();
    }
  });
});

describe('<LiveVideoTabPanel /> styles', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: { can_update: true },
        } as any),
    });
  });

  it('renders with default style when not selected, not hovered, not focused [screenshot]', async () => {
    render(
      wrapInVideo(
        <Tabs>
          <LiveVideoTabPanel
            item={LivePanelItem.APPLICATION}
            selected={false}
          />
        </Tabs>,
        videoMockFactory(),
      ),
    );

    const button = screen.getByRole('tab', { name: 'application' });

    expect(button).toHaveStyle('background-color: rgb(255, 255, 255);');
    expect(button).toHaveStyle('flex: 1;');
    expect(button).toHaveStyle('box-shadow: inset 0 -1px #81ade6;');

    const text = screen.getByText('application');
    expect(text).toHaveStyle('color: rgb(129, 173, 230);');
    expect(text).toHaveStyle('font-size: 0.75rem;');
    expect(text).toHaveStyle('font-weight: bold;');
    expect(text).toHaveStyle('letter-spacing: -0.23px;');
    expect(text).toHaveStyle('text-align: center;');
    expect(text).toHaveStyle('text-transform: uppercase;');

    await imageSnapshot();
  });

  it('renders with selected style [screenshot]', async () => {
    render(
      wrapInVideo(
        <Tabs>
          <LiveVideoTabPanel item={LivePanelItem.APPLICATION} selected={true} />
        </Tabs>,
        videoMockFactory(),
      ),
    );

    const button = screen.getByRole('tab', { name: 'application' });

    expect(button).toHaveStyle('background-color: rgb(255, 255, 255);');
    expect(button).toHaveStyle('flex: 1;');
    expect(button).toHaveStyle('box-shadow: inset 0 -2px #055fd2;');

    const text = screen.getByText('application');

    expect(text).toHaveStyle('color: rgb(5, 95, 210)');
    expect(text).toHaveStyle('font-size: 0.75rem;');
    expect(text).toHaveStyle('font-weight: bold;');
    expect(text).toHaveStyle('letter-spacing: -0.23px;');
    expect(text).toHaveStyle('text-align: center;');
    expect(text).toHaveStyle('text-transform: uppercase;');

    await imageSnapshot();
  });

  it('checks hover style is applied', () => {
    const tree = renderer
      .create(
        wrapInIntlProvider(
          wrapInVideo(
            <LiveVideoTabPanel
              item={LivePanelItem.APPLICATION}
              selected={false}
            />,
            videoMockFactory(),
          ),
        ),
      )
      .toJSON();

    expect(tree).toHaveStyleRule('box-shadow', 'inset 0 -2px #031963', {
      modifier: ':hover',
    });
    expect(tree).toHaveStyleRule('color', '#031963', {
      modifier: ':hover div span',
    });
  });

  it('checks the ringing bell and number of on-stage requests are displayed when  is on', () => {
    useLivePanelState.setState({
      currentItem: LivePanelItem.CHAT,
    });
    const { container } = render(
      wrapInVideo(
        <Tabs>
          <LiveVideoTabPanel
            item={LivePanelItem.VIEWERS_LIST}
            selected={false}
          />
        </Tabs>,
        videoMockFactory({
          participants_asking_to_join: [
            participantMockFactory(),
            participantMockFactory(),
            participantMockFactory(),
            participantMockFactory(),
            participantMockFactory(),
            participantMockFactory(),
          ],
        }),
      ),
    );
    expect(container.querySelector('svg')).not.toBeNull();
    screen.getByText(6);
  });
});
