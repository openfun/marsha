import fetchMock from 'fetch-mock';
import React from 'react';

import { PortabilityConfigMockFactory, useJwt } from 'lib-components';

import { render } from 'lib-tests';
import { PortabilityRequest } from '.';
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('<PortabilityRequest />', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('displays button when no request exists', () => {
    const { getByRole, getByText, queryByText } = render(
      <PortabilityRequest
        portability={PortabilityConfigMockFactory({
          portability_request_exists: false,
        })}
      />,
    );

    getByText('The requested resource is not available for this context.');
    getByText('Please make a request to the playlist owner.');
    getByRole('button', {
      name: 'Request access',
    });
    expect(
      queryByText(
        'A request for portability has already been made to enabled access.',
      ),
    ).not.toBeInTheDocument();

    cleanup();
  });

  it('displays no button when request exists', () => {
    const { queryByText, queryByRole, getByText } = render(
      <PortabilityRequest
        portability={PortabilityConfigMockFactory({
          portability_request_exists: true,
        })}
      />,
    );

    getByText('The requested resource is not available for this context.');
    getByText(
      'A request for portability has already been made to enabled access.',
    );
    expect(
      queryByRole('button', {
        name: 'Request access',
      }),
    ).not.toBeInTheDocument();
    expect(
      queryByText('Please make a request to the playlist owner.'),
    ).not.toBeInTheDocument();

    cleanup();
  });

  it('creates portability request and redirect on button click', async () => {
    const windowSpy = jest.spyOn(window, 'open');

    useJwt.setState({
      getDecodedJwt: () =>
        ({
          playlist_id: '488db2d0-4ec3-11ed-8b4a-7f52311c654f',
          consumer_site: '5b22e8ca-4ec3-11ed-95e2-7b05c22e9f1b',
          user: { id: '6b45a4d6-4ec3-11ed-a182-ebcb09a7afc0' },
        } as any),
    });

    const portabilityAppdata = PortabilityConfigMockFactory({
      portability_request_exists: false,
    });
    const { getByRole, getByText, queryByText } = render(
      <PortabilityRequest portability={portabilityAppdata} />,
    );

    getByText('The requested resource is not available for this context.');
    getByText('Please make a request to the playlist owner.');
    const requestButton = getByRole('button', {
      name: 'Request access',
    });

    fetchMock.postOnce('/api/portability-requests/', {});
    windowSpy.mockImplementation(() => null);

    act(() => {
      userEvent.click(requestButton);
    });

    await waitFor(() =>
      expect(
        queryByText('Please make a request to the playlist owner.'),
      ).not.toBeInTheDocument(),
    );
    getByText('The requested resource is not available for this context.');
    getByText(
      'A request for portability has already been made to enabled access.',
    );
    expect(requestButton).not.toBeInTheDocument();

    expect(windowSpy).toHaveBeenCalledWith(
      portabilityAppdata.redirect_to,
      '_blank',
      'noopener,noreferrer',
    );

    windowSpy.mockRestore();

    cleanup();
  });

  it('display error message when api call fails', async () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          resource_id: '',
          playlist_id: '488db2d0-4ec3-11ed-8b4a-7f52311c654f',
          consumer_site: '5b22e8ca-4ec3-11ed-95e2-7b05c22e9f1b',
          user: { id: '6b45a4d6-4ec3-11ed-a182-ebcb09a7afc0' },
        } as any),
    });

    const { getByRole } = render(
      <PortabilityRequest
        portability={PortabilityConfigMockFactory({
          portability_request_exists: false,
        })}
      />,
    );

    const requestButton = getByRole('button', {
      name: 'Request access',
    });

    fetchMock.postOnce('/api/portability-requests/', 400);

    act(() => {
      userEvent.click(requestButton);
    });

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Portability request failed',
      ),
    );
    cleanup();
  });
});
