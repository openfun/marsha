import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveWidgetTemplate } from '.';
import userEvent from '@testing-library/user-event';

const genericComponent1 = <p>Generic component 1</p>;

const genericTitle = 'An example title';
const genericInfoText = 'An example info text';

describe('<DashboardVideoLiveWidgetTemplate />', () => {
  it('renders DashboardVideoLiveWidgetTemplate opened, with an info text ', () => {
    render(
      wrapInIntlProvider(
        <DashboardVideoLiveWidgetTemplate
          initialOpenValue={true}
          infoText={genericInfoText}
          title={genericTitle}
        >
          {genericComponent1}
        </DashboardVideoLiveWidgetTemplate>,
      ),
    );
    screen.getByText(genericTitle);
    screen.getByText('Generic component 1');
    screen.getByRole('button', { name: genericTitle });
    const infoButton = screen.getAllByRole('button')[0];
    expect(infoButton).not.toBeDisabled();
    expect(screen.queryByText(genericInfoText)).toEqual(null);
  });

  it('renders DashboardVideoLiveWidgetTemplate closed without info text and clicks on the title.', () => {
    render(
      wrapInIntlProvider(
        <DashboardVideoLiveWidgetTemplate
          initialOpenValue={false}
          title={genericTitle}
        >
          {genericComponent1}
        </DashboardVideoLiveWidgetTemplate>,
      ),
    );
    screen.getByText(genericTitle);
    const openButton = screen.getByRole('button', { name: genericTitle });
    expect(screen.queryByText('Generic component 1')).toEqual(null);
    const infoButton = screen.getAllByRole('button')[0];
    expect(infoButton).toBeDisabled();
    expect(screen.queryByText(genericInfoText)).toEqual(null);

    act(() => userEvent.click(openButton));
    screen.getByText('Generic component 1');
  });

  it('renders DashboardVideoLiveWidgetTemplate closed with info text and clicks on info button', () => {
    render(
      wrapInIntlProvider(
        <DashboardVideoLiveWidgetTemplate
          initialOpenValue={false}
          infoText={genericInfoText}
          title={genericTitle}
        >
          {genericComponent1}
        </DashboardVideoLiveWidgetTemplate>,
      ),
    );
    screen.getByText(genericTitle);
    screen.getByRole('button', { name: genericTitle });
    expect(screen.queryByText('Generic component 1')).toEqual(null);
    const infoButton = screen.getAllByRole('button')[0];
    expect(screen.queryByText(genericInfoText)).toEqual(null);

    act(() => userEvent.click(infoButton));
    screen.getByText("Widget's function");
    screen.getByText(genericInfoText);
  });
});
