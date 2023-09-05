/* eslint-disable testing-library/render-result-naming-convention */
import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { markdownDocumentMockFactory } from 'index';
import { useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import {
  markdownRenderLatex,
  useCreateMarkdownDocument,
  useMarkdownDocument,
  useSaveTranslations,
  useUpdateMarkdownDocument,
} from './index';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('queries', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
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
          wrapper: WrapperReactQuery,
        },
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(markdownDocument);
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.mock(`/api/markdown-documents/${markdownDocument.id}/`, 404);

      const { result } = renderHook(
        () => useMarkdownDocument(markdownDocument.id),
        {
          wrapper: WrapperReactQuery,
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useCreateMarkdownDocument', () => {
    it('creates the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.post('/api/markdown-documents/', markdownDocument);

      const { result } = renderHook(() => useCreateMarkdownDocument(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: markdownDocument.playlist.id,
        title: markdownDocument.translations[0].title,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/markdown-documents/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: markdownDocument.playlist.id,
          title: markdownDocument.translations[0].title,
        }),
      });
      expect(result.current.data).toEqual(markdownDocument);
      expect(result.current.status).toEqual('success');
    });

    it('fails to create the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.post('/api/markdown-documents/', 400);

      const { result } = renderHook(() => useCreateMarkdownDocument(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: markdownDocument.playlist.id,
        title: markdownDocument.translations[0].title,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/markdown-documents/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: markdownDocument.playlist.id,
          title: markdownDocument.translations[0].title,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
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
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        is_draft: false,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'PATCH',
        body: JSON.stringify({
          is_draft: false,
        }),
      });
      expect(result.current.data).toEqual(markdownDocument);
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const markdownDocument = markdownDocumentMockFactory();
      fetchMock.patch(`/api/markdown-documents/${markdownDocument.id}/`, 400);

      const { result } = renderHook(
        () => useUpdateMarkdownDocument(markdownDocument.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        is_draft: false,
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'PATCH',
        body: JSON.stringify({
          is_draft: false,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
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
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        language_code: 'fr',
        title: 'Titre',
        content: 'Contenu',
        rendered_content: '<p>Contenu</p>',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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
      expect(result.current.status).toEqual('success');
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
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        language_code: 'fr',
        title: 'Titre',
        content: 'Contenu',
        rendered_content: '<p>Contenu</p>',
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/markdown-documents/${markdownDocument.id}/save-translations/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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
      expect(result.current.status).toEqual('error');
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
          'Accept-Language': 'en',
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
          'Accept-Language': 'en',
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
