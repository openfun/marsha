import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
import { act } from 'react-dom/test-utils';

import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import VideoCreate from './VideoCreate';

jest.mock('./VideoCreateForm', () => ({
  __esModule: true,
  default: () => <div>My VideoCreate Form</div>,
}));

describe('<VideoCreate />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders VideoCreate', () => {
    render(<VideoCreate />);

    expect(
      screen.getByRole('button', { name: /Create Video/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Create Video/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
  });

  it('shows video creation Modal', () => {
    render(<VideoCreate />);
    const createButton = screen.getByRole('button', { name: /Create Video/i });
    userEvent.click(createButton);

    expect(
      screen.getByRole('heading', { name: /Create Video/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('My VideoCreate Form')).toBeInTheDocument();
  });

  it('switches into selection mode on select button click', () => {
    render(<VideoCreate />);
    const selectButton = screen.getByRole('button', { name: 'Select' });
    userEvent.click(selectButton);
    expect(
      screen.queryByRole('button', { name: 'Select' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 0 video' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete 0 video' }),
    ).toBeDisabled();
  });

  it('counts the right amount of selected items (1)', () => {
    render(<VideoCreate />);
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
      screen.getByRole('button', { name: 'Delete 1 video' }),
    ).toBeInTheDocument();
  });

  it('counts the right amount of selected items (3)', () => {
    render(<VideoCreate />);
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
      screen.getByRole('button', { name: 'Delete 3 videos' }),
    ).toBeInTheDocument();
  });

  it('opens the delete confirmation modal', () => {
    render(<VideoCreate />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2', 'id3'],
      }),
    );
    const deleteButon = screen.getByRole('button', { name: 'Delete 3 videos' });
    userEvent.click(deleteButon);

    expect(screen.getByText('Confirm delete 3 videos')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete 3 videos ? This action is irreversible.',
      ),
    ).toBeInTheDocument();
  });

  it('successfully deletes videos', async () => {
    fetchMock.delete('/api/videos/', {
      status: 204,
      body: { ids: ['id1', 'id2'] },
    });

    render(<VideoCreate />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', { name: 'Delete 2 videos' });
    userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 videos',
    });
    userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('2 videos successfully deleted'),
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

  it('fails to delete videos', async () => {
    fetchMock.delete('/api/videos/', {
      status: 400,
      body: { ids: ['id1', 'id2'] },
    });

    render(<VideoCreate />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', { name: 'Delete 2 videos' });
    userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 videos',
    });
    userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('Failed to delete 2 videos'),
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
