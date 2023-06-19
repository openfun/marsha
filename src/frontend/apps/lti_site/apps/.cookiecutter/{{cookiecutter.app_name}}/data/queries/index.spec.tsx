import fetchMock from 'fetch-mock';
import { renderHook } from '@testing-library/react';
import { WrapperReactQuery } from 'lib-tests';
import { useJwt } from 'lib-components';

import { {{cookiecutter.model_lower}}MockFactory } from 'apps/{{cookiecutter.app_name}}/utils/tests/factories';

import {
  use{{cookiecutter.model}},
  use{{cookiecutter.model_plural}},
  useCreate{{cookiecutter.model}},
  useUpdate{{cookiecutter.model}},
} from '.';

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

  describe('use{{cookiecutter.model_plural}}', () => {
    it('requests the resource list', async () => {
      const {{cookiecutter.model_plural_lower}} = Array(4).fill({{cookiecutter.model_lower}}MockFactory());
      fetchMock.mock('/api/{{cookiecutter.model_url_part}}/?limit=999&organization=1', {{cookiecutter.model_plural_lower}});

      const { result } = renderHook(
        () => use{{cookiecutter.model_plural}}({ organization: '1' }),
        {
          wrapper: WrapperReactQuery,
        },
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/{{cookiecutter.model_url_part}}/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual({{cookiecutter.model_plural_lower}});
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource list', async () => {
      fetchMock.mock('/api/{{cookiecutter.model_url_part}}/?limit=999&organization=1', 404);

      const { result } = renderHook(
        () => use{{cookiecutter.model_plural}}({ organization: '1' }),
        { wrapper: Wrapper },
      );

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/{{cookiecutter.model_url_part}}/?limit=999&organization=1',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('use{{cookiecutter.model}}', () => {
    it('requests the resource', async () => {
      const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory();
      fetchMock.mock(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`, {{cookiecutter.model_lower}});

      const { result } = renderHook(() => use{{cookiecutter.model}}({{cookiecutter.model_lower}}.id), {
        wrapper: WrapperReactQuery,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual({{cookiecutter.model_lower}});
      expect(result.current.status).toEqual('success');
    });

    it('fails to get the resource', async () => {
      const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory();
      fetchMock.mock(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`, 404);

      const { result } = renderHook(() => use{{cookiecutter.model}}({{cookiecutter.model_lower}}.id), {
        wrapper: WrapperReactQuery,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useCreate{{cookiecutter.model}}', () => {
    it('creates the resource', async () => {
      const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory();
      fetchMock.post('/api/{{cookiecutter.model_url_part}}/', {{cookiecutter.model_lower}});

      const { result } = renderHook(() => useCreate{{cookiecutter.model}}(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: {{cookiecutter.model_lower}}.playlist.id,
        title: {{cookiecutter.model_lower}}.title!,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/{{cookiecutter.model_url_part}}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: {{cookiecutter.model_lower}}.playlist.id,
          title: {{cookiecutter.model_lower}}.title,
        }),
      });
      expect(result.current.data).toEqual({{cookiecutter.model_lower}});
      expect(result.current.status).toEqual('success');
    });

    it('fails to create the resource', async () => {
      const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory();
      fetchMock.post('/api/{{cookiecutter.model_url_part}}/', 400);

      const { result } = renderHook(() => useCreate{{cookiecutter.model}}(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        playlist: {{cookiecutter.model_lower}}.playlist.id,
        title: {{cookiecutter.model_lower}}.title!,
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/{{cookiecutter.model_url_part}}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          playlist: {{cookiecutter.model_lower}}.playlist.id,
          title: {{cookiecutter.model_lower}}.title,
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('useUpdate{{cookiecutter.model}}', () => {
    it('updates the resource', async () => {
      const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory();
      fetchMock.patch(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`, {{cookiecutter.model_lower}});

      const { result } = renderHook(
        () => useUpdate{{cookiecutter.model}}({{cookiecutter.model_lower}}.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          title: 'updated title',
        }),
      });
      expect(result.current.data).toEqual({{cookiecutter.model_lower}});
      expect(result.current.status).toEqual('success');
    });

    it('fails to update the resource', async () => {
      const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory();
      fetchMock.patch(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`, 400);

      const { result } = renderHook(
        () => useUpdate{{cookiecutter.model}}({{cookiecutter.model_lower}}.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({
        title: 'updated title',
      });
      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/api/{{cookiecutter.model_url_part}}/${{'{'}}{{cookiecutter.model_lower}}.id}/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify({
          title: 'updated title',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});
