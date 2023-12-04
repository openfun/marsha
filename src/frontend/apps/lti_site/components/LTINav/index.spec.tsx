import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  builderDashboardRoute,
  modelName,
  uploadState,
  useAppConfig,
  useCurrentResourceContext,
  useMaintenance,
} from 'lib-components';
import { documentMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import { Fragment } from 'react';
import { useLocation } from 'react-router-dom';

import { builderPlaylistRoute } from 'components/PlaylistPortability/route';
import { builderPlayerRoute } from 'components/routes';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { LTINav } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

const LocationDisplay = () => {
  const location = useLocation();

  return <div data-testid="location-display">{location.pathname}</div>;
};

describe('<LTINav />', () => {
  beforeEach(() => {
    useMaintenance.setState(() => ({
      isActive: false,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Video', () => {
    it('navigates between routes when video is ready', async () => {
      const video = videoMockFactory({
        upload_state: uploadState.READY,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.VIDEOS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: true,
          },
        },
      ] as any);

      render(
        <Fragment>
          <LTINav object={video} />
          <LocationDisplay />
        </Fragment>,
      );

      await userEvent.click(screen.getByRole('link', { name: /dashboard/i }));
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        builderDashboardRoute(modelName.VIDEOS),
      );

      await userEvent.click(screen.getByRole('link', { name: /preview/i }));
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        builderPlayerRoute(modelName.VIDEOS),
      );

      await userEvent.click(screen.getByRole('link', { name: /playlist/i }));
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        builderPlaylistRoute(modelName.VIDEOS),
      );
    });

    it('hides dashboard link when user is not permitted to update video', () => {
      const video = videoMockFactory({
        upload_state: uploadState.READY,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.VIDEOS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: false,
          },
        },
      ] as any);

      render(<LTINav object={video} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides dashboard link when system is under maintenance', () => {
      useMaintenance.setState(() => ({
        isActive: true,
      }));
      const video = videoMockFactory({
        upload_state: uploadState.READY,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.VIDEOS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: true,
          },
        },
      ] as any);

      render(<LTINav object={video} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides preview link when video is not ready', () => {
      const video = videoMockFactory({
        upload_state: uploadState.PENDING,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.VIDEOS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: true,
          },
        },
      ] as any);

      render(<LTINav object={video} />);

      screen.getByRole('link', { name: /dashboard/i });
      expect(screen.queryByRole('link', { name: /preview/i })).toBeNull();
      screen.getByRole('link', { name: /playlist/i });
    });
  });

  describe('Document', () => {
    it('navigates between routes when document is ready.', async () => {
      const document = documentMockFactory({
        upload_state: uploadState.READY,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.DOCUMENTS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: true,
          },
        },
      ] as any);

      render(
        wrapInIntlProvider(
          <Fragment>
            <LTINav object={document} />
            <LocationDisplay />
          </Fragment>,
        ),
      );

      await userEvent.click(screen.getByRole('link', { name: /dashboard/i }));
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        builderDashboardRoute(modelName.DOCUMENTS),
      );

      await userEvent.click(screen.getByRole('link', { name: /preview/i }));
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        builderPlayerRoute(modelName.DOCUMENTS),
      );

      await userEvent.click(screen.getByRole('link', { name: /playlist/i }));
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        builderPlaylistRoute(modelName.DOCUMENTS),
      );
    });

    it('hides dashboard link when user is not permitted to update document', () => {
      const document = documentMockFactory({
        upload_state: uploadState.READY,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.DOCUMENTS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: false,
          },
        },
      ] as any);

      render(<LTINav object={document} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides dashboard link when system is under maintenance', () => {
      useMaintenance.setState(() => ({
        isActive: true,
      }));
      const document = documentMockFactory({
        upload_state: uploadState.READY,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.DOCUMENTS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: true,
          },
        },
      ] as any);

      render(<LTINav object={document} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides preview link when document not ready.', () => {
      const document = documentMockFactory({
        upload_state: uploadState.PENDING,
      });
      mockedUseAppConfig.mockReturnValue({
        modelName: modelName.DOCUMENTS,
      } as any);
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_update: true,
          },
        },
      ] as any);

      render(<LTINav object={document} />);

      screen.getByRole('link', { name: /dashboard/i });
      expect(screen.queryByRole('link', { name: /preview/i })).toBeNull();
      screen.getByRole('link', { name: /playlist/i });
    });
  });
});
