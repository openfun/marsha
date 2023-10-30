import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { InputDisplayNameIncorrectAlert } from '.';

describe('<InputDisplayNameIncorrectAlert />', () => {
  it('displays the alert message given in props.', () => {
    render(
      <InputDisplayNameIncorrectAlert alertMsg="This is an example alert message." />,
    );

    expect(
      screen.getByText('This is an example alert message.'),
    ).toBeInTheDocument();
  });
});
