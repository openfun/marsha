import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider, useJwt } from 'lib-components';
import { render } from 'lib-tests';

import { classroomMockFactory } from '@lib-classroom/utils/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { RetentionDate } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('Classroom <RetentionDate />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the component and set a date with success', async () => {
    const mockedClassroom = classroomMockFactory();

    fetchMock.mock(`/api/classrooms/${mockedClassroom.id}/`, 200, {
      method: 'PATCH',
    });

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <RetentionDate />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    expect(screen.getByText('Retention date')).toBeInTheDocument();
    const datePickerInput = screen.getByRole('textbox');

    fireEvent.change(datePickerInput, {
      target: { value: '2020/01/01' },
    });

    expect((datePickerInput as HTMLInputElement).value).toBe('2020/01/01');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

    const lastCall = fetchMock.lastCall();
    expect(lastCall).not.toBe(undefined);
    expect(lastCall?.[0]).toBe(`/api/classrooms/${mockedClassroom.id}/`);
    expect(lastCall?.[1]?.body).toEqual('{"retention_date":"2020-01-01"}');
    expect(lastCall?.[1]?.method).toBe('PATCH');
  });

  it('renders the component with a default date and deletes it', async () => {
    const mockedClassroom = classroomMockFactory({
      retention_date: '2020-01-01',
    });

    fetchMock.mock(`/api/classrooms/${mockedClassroom.id}/`, 200, {
      method: 'PATCH',
    });

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <RetentionDate />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    expect(screen.getByText('Retention date')).toBeInTheDocument();
    const datePickerInput = await screen.findByRole('textbox');

    expect((datePickerInput as HTMLInputElement).value).toBe('2020/01/01');

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete retention date',
    });

    await userEvent.click(deleteButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

    const lastCall = fetchMock.lastCall();
    expect(lastCall).not.toBe(undefined);
    expect(lastCall?.[0]).toBe(`/api/classrooms/${mockedClassroom.id}/`);
    expect(lastCall?.[1]?.body).toEqual('{"retention_date":null}');
    expect(lastCall?.[1]?.method).toBe('PATCH');
  });

  it('fails to update the video and displays the right error message', async () => {
    // Set by default with an All rights reserved license
    const mockedClassroom = classroomMockFactory({
      retention_date: '2020-01-01',
    });
    fetchMock.patch(`/api/classrooms/${mockedClassroom.id}/`, 401);

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <RetentionDate />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    expect(screen.getByText('Retention date')).toBeInTheDocument();

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete retention date',
    });

    await userEvent.click(deleteButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

    await screen.findByText('Classroom update has failed!');
  });
});
