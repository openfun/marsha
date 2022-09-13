import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useJwt } from 'data/stores/useJwt';

import { markdownDocumentMockFactory } from 'apps/markdown/utils/tests/factories';

import {
  markdownRenderLatex,
  useCreateMarkdownDocument,
  useMarkdownDocument,
  useSaveTranslations,
  useUpdateMarkdownDocument,
} from '.';

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

let Wrapper: React.ComponentType<React.PropsWithChildren<{}>>;

describe('queries', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

    const queryClient = new QueryClient({
      // tslint:disable-next-line:no-console
      logger: { log: console.log, warn: console.warn, error: () => {} },
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = ({ children }: React.PropsWithChildren<{}>) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('useMarkdownDocument', () => {
    it('requests the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.mock(
        `/api/markdown-documents/${markdownDocument.id}/`,
        markdownDocument,
      );

      const { result } = renderHook(
        () => useMarkdownDocument(markdownDocument.id),
        {
          wrapper: Wrapper,
        },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(markdownDocument);
    });

    it('fails to get the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.mock(`/api/markdown-documents/${markdownDocument.id}/`, 404);

      const { result } = renderHook(
        () => useMarkdownDocument(markdownDocument.id),
        {
          wrapper: Wrapper,
        },
      );

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useCreateMarkdownDocument', () => {
    it('creates the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.post('/api/markdown-documents/', markdownDocument);

      const { result } = renderHook(() => useCreateMarkdownDocument(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: markdownDocument.playlist.id,
        title: markdownDocument.translations[0].title!,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(`/api/markdown-documents/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: markdownDocument.playlist.id,
          title: markdownDocument.translations[0].title,
        }),
      });
      expect(result.current.data).toEqual(markdownDocument);
    });

    it('fails to create the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.post('/api/markdown-documents/', 400);

      const { result } = renderHook(() => useCreateMarkdownDocument(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        playlist: markdownDocument.playlist.id,
        title: markdownDocument.translations[0].title!,
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(`/api/markdown-documents/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: markdownDocument.playlist.id,
          title: markdownDocument.translations[0].title,
        }),
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useUpdateMarkdownDocument', () => {
    it('updates the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.patch(
        `/api/markdown-documents/${markdownDocument.id}/`,
        markdownDocument,
      );

      const { result } = renderHook(
        () => useUpdateMarkdownDocument(markdownDocument.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        is_draft: false,
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          is_draft: false,
        }),
      });
      expect(result.current.data).toEqual(markdownDocument);
    });

    it('fails to update the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.patch(`/api/markdown-documents/${markdownDocument.id}/`, 400);

      const { result } = renderHook(
        () => useUpdateMarkdownDocument(markdownDocument.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        is_draft: false,
      });
      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          is_draft: false,
        }),
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('useSaveTranslations', () => {
    it('updates the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.patch(
        `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
        markdownDocument,
      );

      const { result } = renderHook(
        () => useSaveTranslations(markdownDocument.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        language_code: 'fr',
        title: 'Titre',
        content: 'Contenu',
        rendered_content: '<p>Contenu</p>',
      });

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          language_code: 'fr',
          title: 'Titre',
          content: 'Contenu',
          rendered_content: '<p>Contenu</p>',
        }),
      });
      expect(result.current.data).toEqual(markdownDocument);
    });

    it('fails to update the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.patch(
        `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
        400,
      );

      const { result } = renderHook(
        () => useSaveTranslations(markdownDocument.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        language_code: 'fr',
        title: 'Titre',
        content: 'Contenu',
        rendered_content: '<p>Contenu</p>',
      });

      await waitFor(() => expect(result.current.status).toEqual('error'));

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          language_code: 'fr',
          title: 'Titre',
          content: 'Contenu',
          rendered_content: '<p>Contenu</p>',
        }),
      });
      expect(result.current.data).toEqual(undefined);
    });
  });

  describe('markdownRenderLatex', () => {
    it('fetch properly the response', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.post(
        `/api/markdown-documents/${markdownDocument.id}/latex-rendering/`,
        { latex_image: 'Some SVG formated string' },
      );

      const result = await markdownRenderLatex(markdownDocument.id, '\\int x');

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/latex-rendering/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          text: '\\int x',
        }),
      });
      expect(result.latex_image).toEqual('Some SVG formated string');
    });

    it('fails to update the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.post(
        `/api/markdown-documents/${markdownDocument.id}/latex-rendering/`,
        400,
      );

      let result;
      try {
        result = await markdownRenderLatex(markdownDocument.id, '\\int x');
      } catch (e) {
        result = 'caught';
      }

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/latex-rendering/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          text: '\\int x',
        }),
      });
      expect(result).toEqual('caught');
    });
  });
});
