import { screen } from '@testing-library/react';
import { render, renderImageSnapshot } from 'lib-tests';
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

  it('displays the component and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <InputDisplayNameIncorrectAlert alertMsg="This is an example alert message." />,
    );

    expect(
      screen.getByText('This is an example alert message.'),
    ).toBeInTheDocument();
  });
});
