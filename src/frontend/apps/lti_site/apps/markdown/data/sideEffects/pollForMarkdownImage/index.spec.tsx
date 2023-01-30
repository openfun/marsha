import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { report } from 'lib-components';

import { pollForMarkdownImage } from '.';
import { markdownImageMockFactory } from 'lib-markdown';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('apps/markdown/sideEffects/pollForMarkdownImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fetchMock.restore();
  });

  it('polls the image, backing off until it is ready and resolves with a success', async () => {
    fetchMock.mock(
      '/api/markdown-images/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
      JSON.stringify(
        markdownImageMockFactory({
          id: 'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
          is_ready_to_show: false,
        }),
      ),
      { method: 'GET' },
    );

    const promise = pollForMarkdownImage(
      'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
    );

    await waitFor(() => {
      expect(
        fetchMock.calls(
          '/api/markdown-images/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
          {
            method: 'GET',
          },
        ),
      ).toHaveLength(1);
    });

    const markdownImage = markdownImageMockFactory({
      id: 'c43f0c8f-4d3b-4219-86c3-86367b2b88cc',
      is_ready_to_show: true,
    });
    fetchMock.mock(
      '/api/markdown-images/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
      JSON.stringify(markdownImage),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(
        fetchMock.calls(
          '/api/markdown-images/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
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
      '/api/markdown-images/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/',
      404,
      { method: 'GET' },
    );

    await expect(async () => {
      await pollForMarkdownImage('c43f0c8f-4d3b-4219-86c3-86367b2b88cc');
    }).rejects.toThrow(
      'Failed to get /api/markdown-images/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/.',
    );
    expect(report).toHaveBeenCalledWith(
      Error(
        'Failed to get /api/markdown-images/c43f0c8f-4d3b-4219-86c3-86367b2b88cc/.',
      ),
    );
  });

  it('resolves with a failure and reports it when it fails to poll the image', async () => {
    fetchMock.mock(
      '/api/markdown-images/15cf570a-5dc6-421a-9856-59e1b008a6fb/',
      Promise.reject(new Error('Failed to get the image')),
      {
        method: 'GET',
        overwriteRoutes: true,
      },
    );

    await expect(async () => {
      await pollForMarkdownImage('15cf570a-5dc6-421a-9856-59e1b008a6fb');
    }).rejects.toThrow('Failed to get the image');

    expect(report).toHaveBeenCalledWith(Error('Failed to get the image'));
  });
});
