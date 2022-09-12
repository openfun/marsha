import { fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import render from 'utils/tests/render';

import { useJwt } from 'data/stores/useJwt';
import { uploadState } from 'types/tracks';

import { depositedFileMockFactory } from 'apps/deposit/utils/tests/factories';

import { DepositedFileRow } from '.';

const { READY } = uploadState;

describe('<DepositedFileRow />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });
  it('shows deposited file row', async () => {
    const depositedFile = depositedFileMockFactory({
      author_name: 'John Doe',
      filename: 'file.txt',
      size: '12345',
      upload_state: READY,
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file.txt',
    });
    render(<DepositedFileRow file={depositedFile} />);
    screen.getByText('John Doe');
    screen.getByText('01/01/2020 00:00');
    screen.getByText('12.1 KB');
    screen.getByText('file.txt');
    const downloadButton = screen.getByRole('link', { name: 'Download' });
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/file.txt',
    );

    fetchMock.patch(`/api/depositedfiles/${depositedFile.id}/`, {
      ...depositedFile,
      read: true,
    });

    fireEvent.click(downloadButton);
    fireEvent.blur(window);

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/depositedfiles/${depositedFile.id}/`,
      ),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  });
});
