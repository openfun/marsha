import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  useJwt,
  thumbnailMockFactory,
  useThumbnail,
  report,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { ThumbnailRemoveButton } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<ThumbnailRemoveButton />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('clicks on the remove button and removal is successful', async () => {
    const mockedThumbnail = thumbnailMockFactory();
    useThumbnail.getState().addResource(mockedThumbnail);

    fetchMock.delete(`/api/thumbnails/${mockedThumbnail.id}/`, 204);

    render(<ThumbnailRemoveButton thumbnail={mockedThumbnail} />);

    const removeButton = screen.getByRole('button', {
      name: 'Delete thumbnail',
    });

    userEvent.click(removeButton);

    screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    userEvent.click(confirmButton);

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull(),
    );
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/thumbnails/${mockedThumbnail.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    screen.getByText('Thumbnail successfully deleted.');
    expect(report).not.toHaveBeenCalled();
    expect(useThumbnail.getState().thumbnails).toEqual({});
  });

  it('clicks on the remove button and removal fails', async () => {
    const mockedThumbnail = thumbnailMockFactory();
    useThumbnail.getState().addResource(mockedThumbnail);

    fetchMock.delete(`/api/thumbnails/${mockedThumbnail.id}/`, 500);

    render(<ThumbnailRemoveButton thumbnail={mockedThumbnail} />);

    const removeButton = screen.getByRole('button', {
      name: 'Delete thumbnail',
    });

    userEvent.click(removeButton);

    screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    userEvent.click(confirmButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/thumbnails/${mockedThumbnail.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    screen.getByText('Thumbnail deletion failed !');
    expect(report).toHaveBeenCalled();
    expect(useThumbnail.getState().thumbnails).toEqual({
      [mockedThumbnail.id]: mockedThumbnail,
    });
  });
});
