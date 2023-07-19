import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { setLogger } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import { useLtiUserAssociationJwtQueryParam } from './useLtiUserAssociationJwtQueryParam';

const WrappedHookComponent = () => {
  // simply wrap the hook in a component to test it
  // because the hook returns nothing, and we want to test toasts
  const location = useLocation();
  useLtiUserAssociationJwtQueryParam();
  return <div>{`${location.pathname}${location.search}`}</div>;
};

describe('features/PortabilityRequests/hooks/useLtiUserAssociationJwtQueryParam', () => {
  beforeAll(() => {
    setLogger({
      log: console.log,
      warn: console.warn,
      // disable the "invalid json response body" error when testing failure
      error: jest.fn(),
    });
  });

  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useJwt.getState().resetJwt();
  });

  describe('useLtiUserAssociationJwtQueryParam', () => {
    it('does nothing when not association JWT provided', () => {
      render(<WrappedHookComponent />, {
        routerOptions: { history: ['/some/path/'] },
      });

      expect(fetchMock.lastCall()).toBeUndefined();
    });

    it('creates the LTI user association and display toast', async () => {
      fetchMock.postOnce('/api/lti-user-associations/', 'null');

      render(<WrappedHookComponent />, {
        routerOptions: {
          history: ['/some/path/?association_jwt=mocked-jwt&other=param'],
        },
      });

      // Wait for toast to be displayed
      await waitFor(() => {
        expect(
          screen.getByText(
            'Your account has been successfully linked to the LMS identifiers.',
          ),
        ).toBeInTheDocument();
      });
      // Assert the location search has been updated
      expect(screen.getByText('/some/path/?other=param')).toBeInTheDocument();

      expect(fetchMock.lastCall()![0]).toEqual(`/api/lti-user-associations/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          association_jwt: 'mocked-jwt',
        }),
      });
    });

    it('fails to create the LTI user association and display toast', async () => {
      fetchMock.postOnce('/api/lti-user-associations/', 500);

      render(<WrappedHookComponent />, {
        routerOptions: {
          history: ['/some/path/?association_jwt=mocked-jwt&other=param'],
        },
      });

      // Wait for toast to be displayed
      await waitFor(() => {
        expect(
          screen.getByText(
            'An error occurred when linking your account to the LMS identifiers, please try to refresh the page.',
          ),
        ).toBeInTheDocument();
      });
      // Assert the location search has **not** been updated
      expect(
        screen.getByText('/some/path/?association_jwt=mocked-jwt&other=param'),
      ).toBeInTheDocument();

      expect(fetchMock.lastCall()![0]).toEqual(`/api/lti-user-associations/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          association_jwt: 'mocked-jwt',
        }),
      });
    });
  });
});
