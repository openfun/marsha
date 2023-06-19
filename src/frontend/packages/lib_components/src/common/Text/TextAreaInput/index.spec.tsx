import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { TextAreaInput } from '.';

let inputTextValue: string;
let nbrOfCall = 0;
const setValueMock = (value: string) => {
  inputTextValue += value;
  nbrOfCall++;
};

describe('<TextAreaInput />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    nbrOfCall = 0;
    inputTextValue = '';
  });

  it('renders the text area with empty string and placeholder and then types some text', async () => {
    render(
      <TextAreaInput
        placeholder="An example placeholder"
        setValue={setValueMock}
        title="An example title"
        value=""
      />,
    );

    expect(screen.getByText('An example placeholder')).toBeInTheDocument();

    const textInput = screen.getByRole('textbox', { name: 'An example title' });
    await userEvent.type(textInput, 'An example typed text');

    expect(nbrOfCall).toEqual('An example typed text'.length);
    expect(inputTextValue).toEqual('An example typed text');
  });

  it('renders the text area with text', () => {
    render(
      <TextAreaInput
        placeholder="An example placeholder"
        setValue={setValueMock}
        title="An example title"
        value="An example typed text"
      />,
    );

    const textInput = screen.getByRole('textbox', { name: 'An example title' });
    expect(textInput).toHaveValue('An example typed text');
    expect(screen.getByText('An example placeholder')).toBeInTheDocument();
  });
});
