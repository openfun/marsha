import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { DashboardVideoLiveWidgetTemplate } from '.';

const GenericComponent = () => <p>Generic component</p>;

const genericTitle = 'An example title';
const genericInfoText = 'An example info text';

describe('<DashboardVideoLiveWidgetTemplate />', () => {
  it('renders DashboardVideoLiveWidgetTemplate opened, with an info text ', () => {
    const queryClient = new QueryClient();
    render(
      <DashboardVideoLiveWidgetTemplate
        initialOpenValue={true}
        infoText={genericInfoText}
        title={genericTitle}
      >
        <GenericComponent />
      </DashboardVideoLiveWidgetTemplate>,
    );
    screen.getByText(genericTitle);
    screen.getByText('Generic component');
    screen.getByRole('button', { name: genericTitle });
    const infoButton = screen.getAllByRole('button')[0];
    expect(infoButton).not.toBeDisabled();
    expect(screen.queryByText(genericInfoText)).toEqual(null);
  });

  it('renders DashboardVideoLiveWidgetTemplate closed without info text and clicks on the title.', () => {
    const queryClient = new QueryClient();
    render(
      <DashboardVideoLiveWidgetTemplate
        initialOpenValue={false}
        title={genericTitle}
      >
        <GenericComponent />
      </DashboardVideoLiveWidgetTemplate>,
    );
    screen.getByText(genericTitle);
    const openButton = screen.getByRole('button', { name: genericTitle });
    expect(screen.queryByText('Generic component')).toEqual(null);
    const infoButton = screen.getAllByRole('button')[0];
    expect(infoButton).toBeDisabled();
    expect(screen.queryByText(genericInfoText)).toEqual(null);

    act(() => userEvent.click(openButton));
    screen.getByText('Generic component');
  });

  it('renders DashboardVideoLiveWidgetTemplate closed with info text and clicks on info button', () => {
    const queryClient = new QueryClient();

    render(
      <DashboardVideoLiveWidgetTemplate
        initialOpenValue={false}
        infoText={genericInfoText}
        title={genericTitle}
      >
        <GenericComponent />
      </DashboardVideoLiveWidgetTemplate>,
    );
    screen.getByText(genericTitle);
    screen.getByRole('button', { name: genericTitle });
    expect(screen.queryByText('Generic component')).toEqual(null);
    const infoButton = screen.getAllByRole('button')[0];
    expect(screen.queryByText(genericInfoText)).toEqual(null);

    act(() => userEvent.click(infoButton));
    // Indeed, in addition to the title of the widget, there is also the one on the modal
    expect(screen.getAllByText(genericTitle)).toHaveLength(2);
    screen.getByText(genericInfoText);
  });
});
