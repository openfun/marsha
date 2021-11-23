import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { StudentShowSpeakerButton } from '.';

describe('<StudentShowSpeakerButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the speaker button', () => {
    render(wrapInIntlProvider(wrapInRouter(<StudentShowSpeakerButton />)));

    screen.getByRole('button', { name: 'Speaker' });
  });
});
