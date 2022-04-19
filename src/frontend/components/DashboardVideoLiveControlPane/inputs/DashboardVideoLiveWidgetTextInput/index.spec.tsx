import { render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardVideoLiveWidgetTextInput } from '.';
import userEvent from '@testing-library/user-event';

const setValueMock = jest.fn();

describe('<DashboardVideoLiveWidgetTextInput />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the input with empty string and placeholder and then types some text', () => {
    render(
      <DashboardVideoLiveWidgetTextInput
        placeholder="An example placeholder"
        setValue={setValueMock}
        title="An example title"
        value={''}
      />,
    );

    screen.getByText('An example placeholder');

    const textInput = screen.getByRole('textbox', { name: 'An example title' });
    userEvent.type(textInput, 'An example typed text');

    expect(setValueMock).toHaveBeenCalledTimes('An example typed text'.length);
  });

  it('renders the input with text and placeholder', () => {
    render(
      <DashboardVideoLiveWidgetTextInput
        placeholder="An example placeholder"
        setValue={setValueMock}
        title="An example title"
        value={'An example typed text'}
      />,
    );

    expect(screen.queryByText('An example placeholder')).toEqual(null);
    const textInput = screen.getByRole('textbox', { name: 'An example title' });
    expect(textInput).toHaveValue('An example typed text');
  });
});
