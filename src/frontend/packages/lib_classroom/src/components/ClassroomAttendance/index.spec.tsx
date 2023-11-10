import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import ClassroomAttendance from '.';

jest.mock('@lib-components/data/stores/useAppConfig', () => ({
  ...jest.requireActual('@lib-components/data/stores/useAppConfig'),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
}));

describe('<ClassroomAttendance />', () => {
  it('checks render when empty sessions', () => {
    render(<ClassroomAttendance sessions={[]} />);

    expect(
      screen.getByText('The classroom has no participant yet'),
    ).toBeInTheDocument();
  });

  it('checks render when empty attendees', () => {
    render(
      <ClassroomAttendance
        sessions={[
          {
            started_at: '2021-01-01T00:00:00.000Z',
            ended_at: '2021-01-01T00:15:00.000Z',
            attendees: {},
          },
        ]}
      />,
    );

    expect(
      screen.getByText('The classroom has no participant yet'),
    ).toBeInTheDocument();
  });

  it('checks render attendees', () => {
    render(
      <ClassroomAttendance
        sessions={[
          {
            started_at: '2021-01-01T00:00:00.000Z',
            ended_at: '2021-01-01T00:20:00.000Z',
            attendees: {
              '1234': {
                fullname: 'John Doe',
                presence: [
                  {
                    entered_at: Date.parse('2021-01-01T00:05:00.000Z'),
                    left_at: Date.parse('2021-01-01T00:09:59.000Z'),
                  },
                  {
                    entered_at: Date.parse('2021-01-01T00:15:01.000Z'),
                    left_at: 0,
                  },
                ],
              },
              '4321': {
                fullname: 'Jane Die',
                presence: [
                  {
                    entered_at: Date.parse('2021-01-01T00:00:00.000Z'),
                    left_at: Date.parse('2021-01-01T00:11:59.000Z'),
                  },
                  {
                    entered_at: Date.parse('2021-01-01T00:15:00.000Z'),
                    left_at: Date.parse('2021-01-01T00:17:59.000Z'),
                  },
                ],
              },
            },
          },
        ]}
      />,
    );

    const containerAttendee1 = within(screen.getByTestId('attendee-1234-0'));
    expect(containerAttendee1.getByText('John Doe')).toBeInTheDocument();
    expect(containerAttendee1.getByText(/50 %/i)).toBeInTheDocument();
    expect(containerAttendee1.getAllByLabelText(/Present/)).toHaveLength(10);
    expect(containerAttendee1.getAllByLabelText(/Missed/)).toHaveLength(10);

    const containerAttendee2 = within(screen.getByTestId('attendee-4321-0'));
    expect(containerAttendee2.getByText('Jane Die')).toBeInTheDocument();
    expect(containerAttendee2.getByText(/75 %/i)).toBeInTheDocument();
    expect(containerAttendee2.getAllByLabelText(/Present/)).toHaveLength(14);
    expect(containerAttendee2.getAllByLabelText(/Missed/)).toHaveLength(6);
  });

  it('checks sessions order and title', () => {
    render(
      <ClassroomAttendance
        sessions={[
          {
            started_at: '2021-01-01T00:00:00.000Z',
            ended_at: '2021-01-01T00:18:00.000Z',
            attendees: {
              '1234': {
                fullname: 'John Doe',
                presence: [
                  {
                    entered_at: Date.parse('2021-01-01T00:05:00.000Z'),
                    left_at: 0,
                  },
                ],
              },
            },
          },
          {
            started_at: '2021-03-01T00:00:00.000Z',
            ended_at: '2021-03-01T00:20:00.000Z',
            attendees: {
              '1234': {
                fullname: 'John Doe',
                presence: [
                  {
                    entered_at: Date.parse('2021-03-01T00:05:00.000Z'),
                    left_at: 0,
                  },
                ],
              },
            },
          },
        ]}
      />,
    );

    expect(screen.getAllByRole('rowheader')[0].textContent).toBe(
      'Mar 1, 2021, 12:00 AM-Duration: 00:20',
    );
    expect(screen.getAllByRole('rowheader')[1].textContent).toMatch(
      'Jan 1, 2021, 12:00 AM-Duration: 00:18',
    );
  });

  it('checks sessions title localized', () => {
    render(
      <ClassroomAttendance
        sessions={[
          {
            started_at: '2021-01-01T00:00:00.000Z',
            ended_at: '2021-01-01T00:20:00.000Z',
            attendees: {
              '1234': {
                fullname: 'John Doe',
                presence: [
                  {
                    entered_at: Date.parse('2021-01-01T00:05:00.000Z'),
                    left_at: 0,
                  },
                ],
              },
            },
          },
          {
            started_at: '2021-03-01T00:00:00.000Z',
            ended_at: '2021-03-01T00:19:00.000Z',
            attendees: {
              '1234': {
                fullname: 'John Doe',
                presence: [
                  {
                    entered_at: Date.parse('2021-03-01T00:05:00.000Z'),
                    left_at: 0,
                  },
                ],
              },
            },
          },
        ]}
      />,
      {
        intlOptions: {
          locale: 'fr',
          messages: {
            'components.ClassroomAttendance.durationLabel': 'Durée',
          },
        },
      },
    );

    expect(
      screen.getByRole('rowheader', {
        name: /1 janv. 2021, 00:00/,
      }).textContent,
    ).toBe('1 janv. 2021, 00:00-Durée: 00:20');

    expect(
      screen.getByRole('rowheader', {
        name: /1 mars 2021, 00:00/,
      }).textContent,
    ).toBe('1 mars 2021, 00:00-Durée: 00:19');
  });

  it('checks render attendees with multiple sessions', async () => {
    render(
      <ClassroomAttendance
        sessions={[
          {
            started_at: '2021-01-01T00:00:00.000Z',
            ended_at: '2021-01-01T00:20:00.000Z',
            attendees: {
              '1234': {
                fullname: 'John Doe',
                presence: [
                  {
                    entered_at: Date.parse('2021-01-01T00:10:01.000Z'),
                    left_at: 0,
                  },
                ],
              },
            },
          },
          {
            started_at: '2021-03-01T00:00:00.000Z',
            ended_at: '2021-03-01T00:20:00.000Z',
            attendees: {
              '1234': {
                fullname: 'John Doe',
                presence: [
                  {
                    entered_at: Date.parse('2021-03-01T00:05:01.000Z'),
                    left_at: 0,
                  },
                ],
              },
            },
          },
        ]}
      />,
    );

    const containerAttendee0 = within(screen.getByTestId('attendee-1234-0'));
    expect(containerAttendee0.getByText('John Doe')).toBeInTheDocument();
    expect(containerAttendee0.getByText(/75 %/i)).toBeInTheDocument();
    expect(containerAttendee0.getAllByLabelText(/Present/)).toHaveLength(15);
    expect(containerAttendee0.getAllByLabelText(/Missed/)).toHaveLength(5);

    await userEvent.click(screen.getByText('Jan 1, 2021, 12:00 AM'));

    const containerAttendee1 = within(screen.getByTestId('attendee-1234-1'));
    expect(containerAttendee1.getByText('John Doe')).toBeInTheDocument();
    expect(containerAttendee1.getByText(/50 %/i)).toBeInTheDocument();
    expect(containerAttendee1.getAllByLabelText(/Present/)).toHaveLength(10);
    expect(containerAttendee1.getAllByLabelText(/Missed/)).toHaveLength(10);
  });
});
