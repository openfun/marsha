import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useCurrentResourceContext,
  useJwt,
} from 'lib-components';
import { render } from 'lib-tests';

import { classroomMockFactory } from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { DeleteClassroom } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<DeleteClassroom />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('does not render the component on LTI', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedClassroom = classroomMockFactory();
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <DeleteClassroom />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    expect(screen.queryByText('DANGER ZONE')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete classroom' }),
    ).not.toBeInTheDocument();
  });

  it('renders the component on standalone site', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedClassroom = classroomMockFactory();
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <DeleteClassroom />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    expect(screen.getByText('DANGER ZONE')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete classroom' }),
    ).toBeInTheDocument();
  });

  it('successfully opens the confirmation modal', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedClassroom = classroomMockFactory();
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <DeleteClassroom />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    const deleteButton = screen.getByRole('button', {
      name: 'Delete classroom',
    });
    await userEvent.click(deleteButton);
    expect(
      screen.getByText(
        'Are you sure you want to delete this classroom ? This action is irreversible.',
      ),
    ).toBeInTheDocument();
  });

  it('successfully deletes the classroom', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedClassroom = classroomMockFactory();
    fetchMock.delete(`/api/classrooms/${mockedClassroom.id}/`, 204);
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <DeleteClassroom />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    const deleteButton = screen.getByRole('button', {
      name: 'Delete classroom',
    });
    await userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete classroom',
    });
    await userEvent.click(confirmDeleteButton);

    const successMessage = await screen.findByText(
      'Classroom successfully deleted',
    );
    expect(successMessage).toBeInTheDocument();
  });

  it('fails to delete the classroom', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedClassroom = classroomMockFactory();
    fetchMock.delete(`/api/classrooms/${mockedClassroom.id}/`, 403);
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <DeleteClassroom />
        </InfoWidgetModalProvider>,
        mockedClassroom,
      ),
    );

    const deleteButton = screen.getByRole('button', {
      name: 'Delete classroom',
    });
    await userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete classroom',
    });
    await userEvent.click(confirmDeleteButton);

    const errorMessage = await screen.findByText(
      'Failed to delete the classroom',
    );
    expect(errorMessage).toBeInTheDocument();
  });
});
