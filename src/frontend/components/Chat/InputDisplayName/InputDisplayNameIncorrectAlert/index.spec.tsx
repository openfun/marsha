import React from 'react';
import { screen } from '@testing-library/react';

import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';

import { InputDisplayNameIncorrectAlert } from '.';

describe('<InputDisplayNameIncorrectAlert />', () => {
  it('displays the alert message given in props.', () => {
    render(
      <InputDisplayNameIncorrectAlert alertMsg="This is an example alert message." />,
    );
    screen.getByText('This is an example alert message.');
  });

  it('displays the component and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <InputDisplayNameIncorrectAlert alertMsg="This is an example alert message.'" />,
    );
  });
});
