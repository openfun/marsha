import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
import { setLogger } from '@tanstack/react-query';

import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import VideoManage from './VideoManage';

setLogger({
  log: console.log,
  warn: console.warn,
  error: jest.fn(),
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

jest.mock('./VideoCreateForm', () => ({
  __esModule: true,
  default: () => <div>My VideoManage Form</div>,
}));

describe('<VideoManage />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders VideoManage', () => {
    render(<VideoManage />);

    expect(
      screen.getByRole('button', { name: /Create Video/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Create Video/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
  });

  it('shows video creation Modal', async () => {
    render(<VideoManage />);
    const createButton = screen.getByRole('button', { name: /Create Video/i });
    await userEvent.click(createButton);

    expect(
      screen.getByRole('heading', { name: /Create Video/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('My VideoManage Form')).toBeInTheDocument();
  });

  it('switches into selection mode on select button click', async () => {
    render(<VideoManage />);
    const selectButton = screen.getByRole('button', { name: 'Select' });
    await userEvent.click(selectButton);
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
    render(<VideoManage />);
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
    render(<VideoManage />);
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

  it('opens the delete confirmation modal', async () => {
    render(<VideoManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2', 'id3'],
      }),
    );
    const deleteButon = screen.getByRole('button', { name: 'Delete 3 videos' });
    await userEvent.click(deleteButon);

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

    render(<VideoManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', { name: 'Delete 2 videos' });
    await userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 videos',
    });
    await userEvent.click(confirmDeleteButton);

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

    render(<VideoManage />);
    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: ['id1', 'id2'],
      }),
    );
    const deleteButon = screen.getByRole('button', { name: 'Delete 2 videos' });
    await userEvent.click(deleteButon);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete 2 videos',
    });
    await userEvent.click(confirmDeleteButton);

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
