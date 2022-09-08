import { getDefaultNormalizer, screen } from '@testing-library/react';
import React from 'react';
import { useParticipantsStore } from 'data/stores/useParticipantsStore/index';
import render from 'utils/tests/render';

import { LiveInfoBar } from '.';

describe('<LiveInfoBar />', () => {
  it('renders placeholder title, startDate and viewers connected', () => {
    useParticipantsStore.setState({
      participants: [
        {
          id: 'id-anonymous',
          isInstructor: false,
          isOnStage: false,
          name: 'my anonymous name',
        },
        {
          id: 'id-anonymous-2',
          isInstructor: false,
          isOnStage: true,
          name: 'my anonymous name 2',
        },
        {
          id: 'id-named',
          isInstructor: false,
          isOnStage: false,
          name: 'my name',
        },
        {
          id: 'id-instructor',
          isInstructor: true,
          isOnStage: true,
          name: 'my instructor',
        },
      ],
    });

    render(<LiveInfoBar title={'title'} startDate={'2022-09-26T07:00:00Z'} />);

    screen.getByRole('heading', { name: 'title' });
    screen.getByText('9/26/2022  ·  7:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
    screen.getByText('4 viewers connected.');
  });

  it('renders startDate Intl NL - Netherlands', () => {
    render(<LiveInfoBar title={'title'} startDate={'2022-09-26T07:00:00Z'} />, {
      intlOptions: { locale: 'nl' },
    });

    screen.getByText('26-9-2022  ·  07:00:00', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });

  it('renders startDate Intl fr - France', () => {
    render(<LiveInfoBar title={'title'} startDate={'2022-09-26T07:00:00Z'} />, {
      intlOptions: { locale: 'fr' },
    });

    screen.getByText('26/09/2022  ·  07:00:00', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });

  it('renders with invalid startDate', () => {
    render(<LiveInfoBar title={'title'} startDate={'some date'} />);

    screen.getByRole('heading', { name: 'title' });
    expect(screen.queryByText('some date')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid DateTime')).not.toBeInTheDocument();
  });
});
