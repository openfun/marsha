import { useJwt } from '@lib-components/hooks';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';
import { act } from 'react-dom/test-utils';

import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import LiveManage from './LiveManage';

jest.mock('./LiveCreateForm', () => ({
  __esModule: true,
  default: () => <div>My WebinarCreate Form</div>,
}));

describe('<LiveManage />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders LiveManage', () => {
    render(<LiveManage />);

    expect(
      screen.getByRole('button', { name: /Create Webinar/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Create Webinar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
  });

  it('shows video creation Modal', () => {
    render(<LiveManage />);
    const createButton = screen.getByRole('button', {
      name: /Create Webinar/i,
    });
    userEvent.click(createButton);

    expect(
      screen.getByRole('heading', { name: /Create Webinar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('My WebinarCreate Form')).toBeInTheDocument();
  });

  it('switches into selection mode on select button click', () => {
    render(<LiveManage />);
    const selectButton = screen.getByRole('button', { name: 'Select' });
    userEvent.click(selectButton);
    expect(
      screen.queryByRole('button', { name: 'Select' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 0 webinar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 0 webinar' }),
    ).toBeDisabled();
  });

  it('counts the right amount of selected items (1)', () => {
    render(<LiveManage />);
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
      screen.getByRole('button', { name: 'Delete 1 webinar' }),
    ).toBeInTheDocument();
  });

  it('counts the right amount of selected items (3)', () => {
    render(<LiveManage />);
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
      screen.getByRole('button', { name: 'Delete 3 webinars' }),
    ).toBeInTheDocument();
  });

  it('opens the delete confirmation modal', () => {
    render(<LiveManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2', 'id3'],
      }),
    );
    const deleteButon = screen.getByRole('button', {
      name: 'Delete 3 webinars',
    });
    userEvent.click(deleteButon);

    expect(screen.getByText('Confirm delete 3 webinars')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete 3 webinars ? This action is irreversible.',
      ),
    ).toBeInTheDocument();
  });

  it('successfully deletes lives', async () => {
    fetchMock.delete('/api/videos/', {
      status: 204,
      body: { ids: ['id1', 'id2'] },
    });

    render(<LiveManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', {
      name: 'Delete 2 webinars',
    });
    userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 webinars',
    });
    userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('2 webinars successfully deleted'),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      body: `{"ids":["id1","id2"]}`,
      method: 'DELETE',
    });
  });

  it('fails to delete lives', async () => {
    fetchMock.delete('/api/videos/', {
      status: 400,
      body: { ids: ['id1', 'id2'] },
    });

    render(<LiveManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', {
      name: 'Delete 2 webinars',
    });
    userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 webinars',
    });
    userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('Failed to delete 2 webinars'),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      body: `{"ids":["id1","id2"]}`,
      method: 'DELETE',
    });
  });
});
