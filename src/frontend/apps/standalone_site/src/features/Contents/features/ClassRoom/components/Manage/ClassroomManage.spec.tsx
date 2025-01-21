import { useJwt } from '@lib-components/hooks';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';
import React from 'react';

import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import ClassroomManage from './ClassroomManage';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

jest.mock('./ClassRoomCreateForm', () => ({
  __esModule: true,
  default: () => <div>My ClassroomCreate Form</div>,
}));

describe('<ClassroomManage />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders ClassroomManage', () => {
    render(<ClassroomManage />);

    expect(
      screen.getByRole('button', { name: /Create Classroom/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Create Classroom/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
  });

  it('shows classroom creation Modal', async () => {
    render(<ClassroomManage />);
    const createButton = screen.getByRole('button', {
      name: /Create Classroom/i,
    });
    await userEvent.click(createButton);

    expect(
      screen.getByRole('heading', { name: /Create Classroom/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('My ClassroomCreate Form')).toBeInTheDocument();
  });

  it('switches into selection mode on select button click', async () => {
    render(<ClassroomManage />);
    const selectButton = screen.getByRole('button', { name: 'Select' });
    await userEvent.click(selectButton);
    expect(
      screen.queryByRole('button', { name: 'Select' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 0 classroom' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 0 classroom' }),
    ).toBeDisabled();
  });

  it('counts the right amount of selected items (1)', () => {
    render(<ClassroomManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1'],
      }),
    );
    expect(
      screen.queryByRole('button', { name: 'Select' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 1 classroom' }),
    ).toBeInTheDocument();
  });

  it('counts the right amount of selected items (3)', () => {
    render(<ClassroomManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2', 'id3'],
      }),
    );
    expect(
      screen.queryByRole('button', { name: 'Select' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 3 classrooms' }),
    ).toBeInTheDocument();
  });

  it('opens the delete confirmation modal', async () => {
    render(<ClassroomManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2', 'id3'],
      }),
    );
    const deleteButon = screen.getByRole('button', {
      name: 'Delete 3 classrooms',
    });
    await userEvent.click(deleteButon);

    expect(screen.getByText('Confirm delete 3 classrooms')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete 3 classrooms ? This action is irreversible.',
      ),
    ).toBeInTheDocument();
  });

  it('successfully deletes classrooms', async () => {
    fetchMock.delete('/api/classrooms/', {
      status: 204,
      body: { ids: ['id1', 'id2'] },
    });

    render(<ClassroomManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', {
      name: 'Delete 2 classrooms',
    });
    await userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 classrooms',
    });
    await userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('2 classrooms successfully deleted'),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      body: `{"ids":["id1","id2"]}`,
      method: 'DELETE',
    });
  });

  it('fails to delete classrooms', async () => {
    fetchMock.delete('/api/classrooms/', {
      status: 400,
      body: { ids: ['id1', 'id2'] },
    });

    render(<ClassroomManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', {
      name: 'Delete 2 classrooms',
    });
    await userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 classrooms',
    });
    await userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('Failed to delete 2 classrooms'),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual(`/api/classrooms/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      body: `{"ids":["id1","id2"]}`,
      method: 'DELETE',
    });
  });

  it('controls that the component does not stay selectable when unmount', () => {
    const { unmount } = render(<ClassroomManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
      }),
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    unmount();

    expect(useSelectFeatures.getState().isSelectionEnabled).toBe(false);
  });
});
