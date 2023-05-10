import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  liveMockFactory,
  useCurrentResourceContext,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { DeleteVideo } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<DeleteVideo />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('does not render the component on LTI', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedVideo = videoMockFactory();
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.queryByText('DANGER ZONE')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('renders the component on standalone site', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedVideo = videoMockFactory();
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('DANGER ZONE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('successfully opens the confirmation modal', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedVideo = videoMockFactory();
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    userEvent.click(deleteButton);
    expect(
      screen.getByText(
        'Are you sure you want to delete this video ? This action is irreversible.',
      ),
    ).toBeInTheDocument();
  });

  it('successfully deletes the video', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedVideo = videoMockFactory();
    fetchMock.delete(`/api/videos/${mockedVideo.id}/`, 204);
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete video',
    });
    userEvent.click(confirmDeleteButton);

    const successMessage = await screen.findByText(
      'Video successfully deleted',
    );
    expect(successMessage).toBeInTheDocument();
  });

  it('successfully deletes a webinar', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedLive = liveMockFactory();
    fetchMock.delete(`/api/videos/${mockedLive.id}/`, 204);
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteVideo />
        </InfoWidgetModalProvider>,
        mockedLive,
      ),
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete webinar',
    });
    userEvent.click(confirmDeleteButton);

    const successMessage = await screen.findByText('Live successfully deleted');
    expect(successMessage).toBeInTheDocument();
  });

  it('fails to delete the video', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedVideo = videoMockFactory();
    fetchMock.delete(`/api/videos/${mockedVideo.id}/`, 403);
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete video',
    });
    userEvent.click(confirmDeleteButton);

    const errorMessage = await screen.findByText('Failed to delete the video');
    expect(errorMessage).toBeInTheDocument();
  });
});
