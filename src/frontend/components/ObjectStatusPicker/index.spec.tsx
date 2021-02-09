import { render, screen } from '@testing-library/react';
import React from 'react';

import { ObjectStatusPicker } from '.';
import { liveState, uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

const {
  DELETED,
  ERROR,
  HARVESTED,
  HARVESTING,
  PENDING,
  PROCESSING,
  READY,
  UPLOADING,
} = uploadState;
const { IDLE, STARTING, RUNNING, STOPPED } = liveState;

describe('<ObjectStatusPicker />', () => {
  it('renders the status list for upload state PENDING', () => {
    render(wrapInIntlProvider(<ObjectStatusPicker state={PENDING} />));

    screen.getByText('Missing ❌');
  });

  it('renders the status list for upload state UPLOADING', () => {
    const { getByText } = render(
      wrapInIntlProvider(<ObjectStatusPicker state={UPLOADING} />),
    );

    getByText('Uploading');
  });

  it('renders the status list for upload state PROCESSING', () => {
    render(wrapInIntlProvider(<ObjectStatusPicker state={PROCESSING} />));

    screen.getByText('Processing');
  });

  it('renders the status list for upload state READY', () => {
    render(wrapInIntlProvider(<ObjectStatusPicker state={READY} />));

    screen.getByText('Ready ✔️');
  });

  it('renders the status list for upload state ERROR', () => {
    render(wrapInIntlProvider(<ObjectStatusPicker state={ERROR} />));

    screen.getByText('Error ❌');
  });

  it('renders the status list for upload state DELETED', () => {
    render(wrapInIntlProvider(<ObjectStatusPicker state={DELETED} />));

    screen.getByText('Deleted ❌');
  });

  it('renders the status list for upload state HARVESTING', () => {
    render(wrapInIntlProvider(<ObjectStatusPicker state={HARVESTING} />));

    screen.getByText('Transforming live in VOD');
  });

  it('renders the status list for upload state HARVESTED', () => {
    render(wrapInIntlProvider(<ObjectStatusPicker state={HARVESTED} />));

    screen.getByText('Waiting VOD publication ✔️');
  });

  it('renders the status list for live state IDLE', () => {
    render(
      wrapInIntlProvider(
        <ObjectStatusPicker state={PENDING} liveState={IDLE} />,
      ),
    );

    screen.getByText('Ready to start live');
  });

  it('renders the status list for live state STARTING', () => {
    render(
      wrapInIntlProvider(
        <ObjectStatusPicker state={PENDING} liveState={STARTING} />,
      ),
    );

    screen.getByText('live Starting');
  });

  it('renders the status list for live state RUNNING', () => {
    render(
      wrapInIntlProvider(
        <ObjectStatusPicker state={PENDING} liveState={RUNNING} />,
      ),
    );

    screen.getByText('Live is running');
  });

  it('renders the status list for live state STOPPED', () => {
    render(
      wrapInIntlProvider(
        <ObjectStatusPicker state={PENDING} liveState={STOPPED} />,
      ),
    );

    screen.getByText('Live ended');
  });
});
