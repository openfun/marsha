import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, screen } from '@testing-library/react';

import { LivePanelItem } from 'data/stores/useLivePanelState';
import { imageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { LiveVideoTabPanel } from '.';

describe('<LiveVideoTabPanel /> titles', () => {
  it('renders for item in LivePanelItem', () => {
    const tabTitles = {
      [LivePanelItem.APPLICATION]: 'application',
      [LivePanelItem.CHAT]: 'chat',
      [LivePanelItem.JOIN_DISCUSSION]: 'viewers',
    };

    for (const itemStr in LivePanelItem) {
      if (typeof itemStr !== 'string') {
        continue;
      }

      const item = itemStr as LivePanelItem;

      render(
        wrapInIntlProvider(<LiveVideoTabPanel item={item} selected={false} />),
      );

      screen.getByText(tabTitles[item]);

      cleanup();

      render(
        wrapInIntlProvider(<LiveVideoTabPanel item={item} selected={true} />),
      );

      screen.getByText(tabTitles[item]);
    }
  });
});

describe('<LiveVideoTabPanel /> styles', () => {
  it('renders with default style when not selected, not hovered, not focused', async () => {
    render(
      wrapInIntlProvider(
        <LiveVideoTabPanel item={LivePanelItem.APPLICATION} selected={false} />,
      ),
    );

    const button = screen.getByRole('tab');

    expect(button).toHaveStyle('background-color: rgb(255, 255, 255);');
    expect(button).toHaveStyle('flex: 1;');
    expect(button).toHaveStyle('box-shadow: inset 0 -1px #81ade6;');

    const text = screen.getByRole('tab_title');

    expect(text).toHaveStyle('color: rgb(129, 173, 230);');
    expect(text).toHaveStyle('font-family: Roboto-Bold;');
    expect(text).toHaveStyle('font-size: 10px;');
    expect(text).toHaveStyle('font-weight: bold;');
    expect(text).toHaveStyle('letter-spacing: -0.23px;');
    expect(text).toHaveStyle('text-align: center;');
    expect(text).toHaveStyle('text-transform: uppercase;');

    await imageSnapshot();
  });

  it('renders with selected style', async () => {
    render(
      wrapInIntlProvider(
        <LiveVideoTabPanel item={LivePanelItem.APPLICATION} selected={true} />,
      ),
    );

    const button = screen.getByRole('tab');

    expect(button).toHaveStyle('background-color: rgb(255, 255, 255);');
    expect(button).toHaveStyle('flex: 1;');
    expect(button).toHaveStyle('box-shadow: inset 0 -2px #0a67de;');

    const text = screen.getByRole('tab_title');

    expect(text).toHaveStyle('color: rgb(10, 103, 222)');
    expect(text).toHaveStyle('font-family: Roboto-Bold;');
    expect(text).toHaveStyle('font-size: 10px;');
    expect(text).toHaveStyle('font-weight: bold;');
    expect(text).toHaveStyle('letter-spacing: -0.23px;');
    expect(text).toHaveStyle('text-align: center;');
    expect(text).toHaveStyle('text-transform: uppercase;');

    await imageSnapshot();
  });

  it('checks hover style is applied', async () => {
    const tree = renderer
      .create(
        wrapInIntlProvider(
          <LiveVideoTabPanel
            item={LivePanelItem.APPLICATION}
            selected={false}
          />,
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
});
