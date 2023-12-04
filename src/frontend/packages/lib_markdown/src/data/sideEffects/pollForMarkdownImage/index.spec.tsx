import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { report } from 'lib-components';
import { v4 as uuidv4 } from 'uuid';

import { markdownImageMockFactory } from '@lib-markdown/tests';

import { pollForMarkdownImage } from './index';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const markdownDocumentId = uuidv4();
const markdownImageId = uuidv4();

describe('pollForMarkdownImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    fetchMock.restore();
  });

  it('polls the image, backing off until it is ready and resolves with a success', async () => {
    fetchMock.mock(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/`,
      JSON.stringify(
        markdownImageMockFactory({
          id: markdownImageId,
          is_ready_to_show: false,
        }),
      ),
      { method: 'GET' },
    );

    const promise = pollForMarkdownImage(
      markdownDocumentId,
      markdownImageId,
      1,
    );

    await waitFor(() => {
      expect(
        fetchMock.calls(
          `/api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/`,
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(1);
    });

    const markdownImage = markdownImageMockFactory({
      id: markdownImageId,
      is_ready_to_show: true,
    });
    fetchMock.mock(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/`,
      JSON.stringify(markdownImage),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    await waitFor(() => {
      expect(
        fetchMock.calls(
          `/api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/`,
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(2);
    });

    expect(await promise).toEqual(markdownImage);
  });

  it('polls non-existing image', async () => {
    fetchMock.mock(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/`,
      404,
      { method: 'GET' },
    );

    await expect(async () => {
      await pollForMarkdownImage(markdownDocumentId, markdownImageId);
    }).rejects.toThrow(
      `Failed to get /api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/.`,
    );
    expect(report).toHaveBeenCalledWith(
      Error(
        `Failed to get /api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/.`,
      ),
    );
  });

  it('resolves with a failure and reports it when it fails to poll the image', async () => {
    fetchMock.mock(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/${markdownImageId}/`,
      Promise.reject(new Error('Failed to get the image')),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    await expect(async () => {
      await pollForMarkdownImage(markdownDocumentId, markdownImageId);
    }).rejects.toThrow('Failed to get the image');

    expect(report).toHaveBeenCalledWith(Error('Failed to get the image'));
  });
});
