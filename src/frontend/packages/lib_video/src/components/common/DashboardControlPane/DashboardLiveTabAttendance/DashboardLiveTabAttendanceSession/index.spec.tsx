import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { DashboardLiveTabAttendanceSession } from '.';

describe('<DashboardLiveTabAttendanceSession />', () => {
  it('renders the livesession with no activity and the username is bold if the user was registered', () => {
    const liveSession = {
      id: '34d73670-885c-4a84-b208-8246bfd05949',
      display_name: 'sam',
      is_registered: true,
      live_attendance: {
        1654182099: {},
        1654182115: {},
        1654182131: {},
        1654182147: {},
        1654182163: {},
      },
    };

    render(<DashboardLiveTabAttendanceSession liveSession={liveSession} />);

    screen.getByLabelText('Missed the live');
    const username = screen.getByText('sam');
    expect(username).toHaveClass('fw-bold');
    screen.getByText('-');
    // there are 5 timestamps
    expect(screen.getAllByLabelText('Missed').length).toEqual(5);
    expect(screen.queryAllByLabelText('Present').length).toEqual(0);
  });

  it('renders the livesession with partial activity and the username is not bold if the user was not registered', () => {
    const liveSession = {
      id: 'id',
      display_name: 'sam',
      is_registered: false,
      live_attendance: {
        1654182083: {},
        1654182099: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182099,
          fullScreen: false,
          player_timer: 207.525995,
        },
        1654182115: {},
        1654182131: {},
        1654182147: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182147,
          fullScreen: false,
          player_timer: 207.525995,
        },
        1654182163: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182163,
          fullScreen: false,
          player_timer: 207.525995,
        },
      },
    };
    render(<DashboardLiveTabAttendanceSession liveSession={liveSession} />);

    screen.getByLabelText('Partially present');
    const username = screen.getByText('sam');
    expect(username).toHaveClass('fw-medium');
    screen.getByText('50 %');
    // there are 6 timestamps
    expect(screen.getAllByLabelText('Missed').length).toEqual(3);
    expect(screen.queryAllByLabelText('Present').length).toEqual(3);
    screen.getByTestId('Missed_id_0');
    screen.getByTestId('Missed_id_2');
    screen.getByTestId('Missed_id_3');

    screen.getByTestId('Present_id_1');
    screen.getByTestId('Present_id_4');
    screen.getByTestId('Present_id_5');
  });

  it('renders the livesession with diligent activity', () => {
    const liveSession = {
      id: 'id',
      display_name: 'sam',
      is_registered: false,
      live_attendance: {
        1654182083: {},
        1654182099: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182099,
          fullScreen: false,
          player_timer: 207.525995,
        },
        1654182115: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182115,
          fullScreen: false,
          player_timer: 207.525995,
        },
        1654182131: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182131,
          fullScreen: false,
          player_timer: 207.525995,
        },
        1654182147: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182147,
          fullScreen: false,
          player_timer: 207.525995,
        },
        1654182163: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182163,
          fullScreen: false,
          player_timer: 207.525995,
        },
      },
    };
    render(<DashboardLiveTabAttendanceSession liveSession={liveSession} />);

    screen.getByLabelText('Very diligent');

    const username = screen.getByText('sam');
    expect(username).toHaveClass('fw-medium');
    screen.getByText('83 %');
    // there are 6 timestamps
    expect(screen.getAllByLabelText('Missed').length).toEqual(1);
    expect(screen.queryAllByLabelText('Present').length).toEqual(5);
    screen.getByTestId('Missed_id_0');

    screen.getByTestId('Present_id_1');
    screen.getByTestId('Present_id_2');
    screen.getByTestId('Present_id_3');
    screen.getByTestId('Present_id_4');
    screen.getByTestId('Present_id_5');
  });

  it('considers user to be present when he was connected in between', () => {
    const liveSession = {
      id: 'id',
      display_name: 'sam',
      is_registered: false,
      live_attendance: {
        1654182083: {},
        1654182099: { connectedInBetween: true, lastConnected: 1654182090 },
        1654182115: {
          muted: false,
          volume: 1,
          playing: true,
          timestamp: 1654182115,
          fullScreen: false,
          player_timer: 207.525995,
        },
      },
    };

    render(<DashboardLiveTabAttendanceSession liveSession={liveSession} />);

    screen.getByLabelText('Partially present');

    const username = screen.getByText('sam');
    expect(username).toHaveClass('fw-medium');
    screen.getByText('67 %');
    // there are 3 timestamps
    expect(screen.getAllByLabelText('Missed').length).toEqual(1);
    expect(screen.queryAllByLabelText('Present').length).toEqual(2);
    screen.getByTestId('Missed_id_0');
    screen.getByTestId('Present_id_1');
    screen.getByTestId('Present_id_2');
  });

  it('considers user to be present when he was on stage', () => {
    const liveSession = {
      id: 'id',
      display_name: 'sam',
      is_registered: false,
      live_attendance: {
        1654182083: {},
        1654182099: { onStage: true },
        1654182115: { onStage: true },
        1654182131: { onStage: true },
        1654182147: { onStage: true },
      },
    };

    render(<DashboardLiveTabAttendanceSession liveSession={liveSession} />);

    screen.getByLabelText('Very diligent');

    const username = screen.getByText('sam');
    expect(username).toHaveClass('fw-medium');
    screen.getByText('80 %');
    // there are 5 timestamps
    expect(screen.getAllByLabelText('Missed').length).toEqual(1);
    expect(screen.queryAllByLabelText('Present').length).toEqual(4);
    screen.getByTestId('Missed_id_0');
    screen.getByTestId('Present_id_1');
    screen.getByTestId('Present_id_2');
    screen.getByTestId('Present_id_3');
  });

  it('renders the livesession with no activity if there is no timeline for the video', () => {
    const liveSession = {
      id: '34d73670-885c-4a84-b208-8246bfd05949',
      display_name: 'sam',
      is_registered: true,
      live_attendance: {},
    };
    render(<DashboardLiveTabAttendanceSession liveSession={liveSession} />);

    screen.getByLabelText('Missed the live');
    const username = screen.getByText('sam');
    expect(username).toHaveClass('fw-bold');
    screen.getByText('-');
    // no timestamps
    expect(screen.queryAllByLabelText('Missed').length).toEqual(0);
    expect(screen.queryAllByLabelText('Present').length).toEqual(0);
  });
});
