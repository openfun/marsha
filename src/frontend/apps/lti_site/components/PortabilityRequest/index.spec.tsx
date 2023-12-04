import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { PortabilityConfigMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { PortabilityRequest } from '.';

describe('<PortabilityRequest />', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('displays button when no request exists', () => {
    render(
      <PortabilityRequest
        portability={PortabilityConfigMockFactory({
          portability_request_exists: false,
        })}
      />,
    );

    screen.getByText(
      'The requested resource is not available for this context.',
    );
    screen.getByText('Please make a request to the playlist owner.');
    screen.getByRole('button', {
      name: 'Request access',
    });
    expect(
      screen.queryByText(
        'A request for portability has already been made to enabled access.',
      ),
    ).not.toBeInTheDocument();

    cleanup();
  });

  it('displays no button when request exists', () => {
    render(
      <PortabilityRequest
        portability={PortabilityConfigMockFactory({
          portability_request_exists: true,
        })}
      />,
    );

    screen.getByText(
      'The requested resource is not available for this context.',
    );
    screen.getByText(
      'A request for portability has already been made to enabled access.',
    );
    expect(
      screen.queryByRole('button', {
        name: 'Request access',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Please make a request to the playlist owner.'),
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
        }) as any,
    });

    const portabilityAppdata = PortabilityConfigMockFactory({
      portability_request_exists: false,
    });
    render(<PortabilityRequest portability={portabilityAppdata} />);

    screen.getByText(
      'The requested resource is not available for this context.',
    );
    screen.getByText('Please make a request to the playlist owner.');
    const requestButton = screen.getByRole('button', {
      name: 'Request access',
    });

    fetchMock.postOnce('/api/portability-requests/', {});
    windowSpy.mockImplementation(() => null);

    await userEvent.click(requestButton);

    await waitFor(() =>
      expect(
        screen.queryByText('Please make a request to the playlist owner.'),
      ).not.toBeInTheDocument(),
    );
    screen.getByText(
      'The requested resource is not available for this context.',
    );
    screen.getByText(
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
        }) as any,
    });

    render(
      <PortabilityRequest
        portability={PortabilityConfigMockFactory({
          portability_request_exists: false,
        })}
      />,
    );

    const requestButton = screen.getByRole('button', {
      name: 'Request access',
    });

    fetchMock.postOnce('/api/portability-requests/', 400);

    await userEvent.click(requestButton);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Portability request failed',
      ),
    );
    cleanup();
  });
});
