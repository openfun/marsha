import { screen } from '@testing-library/react';
import {
  FULL_SCREEN_ERROR_ROUTE,
  appState,
  modelName,
  uploadState,
  useAppConfig,
  useCurrentResourceContext,
} from 'lib-components';
import {
  ltiInstructorTokenMockFactory,
  ltiStudentTokenMockFactory,
} from 'lib-components/tests';
import { render } from 'lib-tests';

import { LTIInnerRoutes } from './';

jest.mock('lib-video', () => ({
  ...jest.requireActual('lib-video'),
  DashboardVideoWrapper: () => <div>My DashboardVideoWrapper</div>,
  CreateVOD: () => <div>My CreateVOD</div>,
  ConfigureLiveButton: () => <div>My ConfigureLiveButton</div>,
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
  useCurrentResourceContext: jest.fn(),
  WizardLayout: ({ children }: any) => <div>My WizardLayout {children}</div>,
  UploadForm: ({ objectId, objectType }: any) => (
    <div>
      My UploadForm {objectType} {objectId}
    </div>
  ),
  FullScreenError: ({ code }: any) => <div>My FullScreenError {code}</div>,
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;
const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

jest.mock('components/DashboardDocument', () => ({
  __esModule: true,
  default: () => <div>My DashboardDocument</div>,
}));
jest.mock('components/LTINav', () => ({
  LTINav: () => <div>My LTINav</div>,
}));

jest.mock('components/PlaylistPortability', () => ({
  PlaylistPortability: ({ object }: any) => (
    <div>My PlaylistPortability {object}</div>
  ),
}));

jest.mock('components/InstructorWrapper', () => ({
  InstructorWrapper: () => <div>My PlayerPages</div>,
}));

jest.mock('components/PortabilityRequest', () => ({
  PortabilityRequest: () => <div>My PortabilityRequest</div>,
}));

jest.mock('components/SelectContent', () => ({
  SelectContent: () => <div>My SelectContent</div>,
}));

jest.setTimeout(15000);

describe('<LTIRoutes />', () => {
  beforeEach(() => {
    mockedUseAppConfig.mockReturnValue({
      frontend: 'test',
    } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checks the dashboard routes', () => {
    test('matching for Documents', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        document: 'anything',
        modelName: modelName.DOCUMENTS,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/dashboard/123456'],
        },
      });

      expect(await screen.findByText('My LTINav')).toBeInTheDocument();
      expect(
        await screen.findByText('My DashboardDocument'),
      ).toBeInTheDocument();
    });

    test('matching for Video', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        video: 'any video',
        modelName: modelName.VIDEOS,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/dashboard/123456'],
        },
      });

      expect(
        await screen.findByText('My DashboardVideoWrapper'),
      ).toBeInTheDocument();
    });

    test('matching without managed model', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        video: 'any video',
        modelName: modelName.THUMBNAILS,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/dashboard/123456'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });

    test('not matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/dashboard/'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });
  });

  describe('checks the player routes', () => {
    test.each([
      { route: 'videos', type: 'video' },
      { route: 'documents', type: 'document' },
    ])(
      '$route matching, with appData.$type defined',
      async ({ route, type }) => {
        mockedUseAppConfig.mockReturnValue({
          frontend: 'test',
          [type]: {
            upload_state: uploadState.READY,
          },
        } as any);

        render(<LTIInnerRoutes />, {
          routerOptions: {
            history: [`/player/${route}`],
          },
        });

        expect(await screen.findByText('My PlayerPages')).toBeInTheDocument();
      },
    );

    test.each([
      { route: 'videos', type: 'video' },
      { route: 'documents', type: 'document' },
    ])('$route matching, with appData.$type undefined', async ({ route }) => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: [`/player/${route}`],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });

    it('not matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/player/idunno'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });
  });

  describe('checks the video_wizzard routes', () => {
    test('matching without video', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/video_wizzard/totally/anything'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });

    test('matching video', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        video: {
          upload_state: uploadState.READY,
        },
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/video_wizzard/totally/anything'],
        },
      });

      expect(await screen.findByText('Create a video')).toBeInTheDocument();
      expect(
        await screen.findByText('My ConfigureLiveButton'),
      ).toBeInTheDocument();
    });

    test('create_vod', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        video: {
          upload_state: uploadState.READY,
        },
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/video_wizzard/create_vod'],
        },
      });

      expect(await screen.findByText('My CreateVOD')).toBeInTheDocument();
    });
  });

  describe('checks the portability-request routes', () => {
    test('matching with portability', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        state: appState.PORTABILITY,
        portability: 'anything',
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/portability-request/'],
        },
      });

      expect(
        await screen.findByText('My PortabilityRequest'),
      ).toBeInTheDocument();
    });

    test('matching without portability', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        state: appState.PORTABILITY,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/portability-request/'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });

    test('not matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/portability-request/idunno'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });
  });

  describe('checks the select routes', () => {
    test('matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/select/'],
        },
      });

      expect(await screen.findByText('My SelectContent')).toBeInTheDocument();
    });

    test('not matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/select/idunno'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });
  });

  describe('checks the form routes', () => {
    test('matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/form/myType/myId'],
        },
      });

      expect(
        await screen.findByText('My UploadForm myType myId'),
      ).toBeInTheDocument();
    });

    test('not matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/form/idunno'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });
  });

  describe('checks the errors routes', () => {
    test.each(
      Object.values(FULL_SCREEN_ERROR_ROUTE.codes).map((code) => ({
        code: code,
      })),
    )('with code $code', async ({ code }) => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: [`/errors/${code}`],
        },
      });

      expect(
        await screen.findByText(`My FullScreenError ${code}`),
      ).toBeInTheDocument();
    });

    test('not matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/errors/idunno'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });
  });

  describe('checks the playlist routes', () => {
    test('matching with Documents', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        document: 'any documents',
        modelName: modelName.DOCUMENTS,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/playlist/myType'],
        },
      });

      expect(await screen.findByText('My LTINav')).toBeInTheDocument();
      expect(
        await screen.findByText('My PlaylistPortability any documents'),
      ).toBeInTheDocument();
    });

    test('matching with Videos', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        video: 'any videos',
        modelName: modelName.VIDEOS,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/playlist/myType'],
        },
      });

      expect(await screen.findByText('My LTINav')).toBeInTheDocument();
      expect(
        await screen.findByText('My PlaylistPortability any videos'),
      ).toBeInTheDocument();
    });

    test('matching without managed model', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        video: 'any video',
        modelName: modelName.THUMBNAILS,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/playlist/myType'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });

    test('not matching', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/playlist/myType/idunno'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });
  });

  describe('checks redirect routes', () => {
    test('with appState.ERROR', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        state: appState.ERROR,
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError lti'),
      ).toBeInTheDocument();
    });

    test('with appState.PORTABILITY', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        state: appState.PORTABILITY,
        portability: 'anything',
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/'],
        },
      });

      expect(
        await screen.findByText('My PortabilityRequest'),
      ).toBeInTheDocument();
    });

    test('with appState.lti_select_form_data', async () => {
      mockedUseAppConfig.mockReturnValue({
        frontend: 'test',
        lti_select_form_data: 'anything',
      } as any);

      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/'],
        },
      });

      expect(await screen.findByText('My SelectContent')).toBeInTheDocument();
    });

    test('without resource', async () => {
      render(<LTIInnerRoutes />, {
        routerOptions: {
          history: ['/'],
        },
      });

      expect(
        await screen.findByText('My FullScreenError notFound'),
      ).toBeInTheDocument();
    });

    describe('with appData.modelName DOCUMENTS', () => {
      test('and ready to show', async () => {
        mockedUseAppConfig.mockReturnValue({
          frontend: 'test',
          modelName: modelName.DOCUMENTS,
          document: {
            is_ready_to_show: true,
          },
        } as any);
        mockedUseCurrentResourceContext.mockReturnValue([
          ltiInstructorTokenMockFactory(),
        ] as any);

        render(<LTIInnerRoutes />, {
          routerOptions: {
            history: ['/'],
          },
        });

        expect(await screen.findByText('My PlayerPages')).toBeInTheDocument();
      });

      test('and NOT ready to show AND can update permission', async () => {
        mockedUseAppConfig.mockReturnValue({
          frontend: 'test',
          modelName: modelName.DOCUMENTS,
          document: {
            is_ready_to_show: false,
          },
        } as any);
        mockedUseCurrentResourceContext.mockReturnValue([
          ltiInstructorTokenMockFactory(),
        ] as any);

        render(<LTIInnerRoutes />, {
          routerOptions: {
            history: ['/'],
          },
        });

        expect(await screen.findByText('My LTINav')).toBeInTheDocument();
        expect(
          await screen.findByText('My DashboardDocument'),
        ).toBeInTheDocument();
      });

      test('and NOT ready to show AND cannot update permission', async () => {
        mockedUseAppConfig.mockReturnValue({
          frontend: 'test',
          modelName: modelName.DOCUMENTS,
          document: {
            is_ready_to_show: false,
          },
        } as any);
        mockedUseCurrentResourceContext.mockReturnValue([
          ltiStudentTokenMockFactory(),
        ] as any);

        render(<LTIInnerRoutes />, {
          routerOptions: {
            history: ['/'],
          },
        });

        expect(
          await screen.findByText('My FullScreenError notFound'),
        ).toBeInTheDocument();
      });
    });

    describe('with appData.modelName VIDEOS', () => {
      test.each([
        {
          video: {
            upload_state: uploadState.DELETED,
          },
          expectedText: 'My FullScreenError videoDeleted',
        },
        {
          video: {
            live_type: true,
          },
          expectedText: 'My DashboardVideoWrapper',
        },
        {
          video: {
            is_ready_to_show: true,
          },
          expectedText: 'My DashboardVideoWrapper',
        },
        {
          video: {
            upload_state: uploadState.PROCESSING,
          },
          expectedText: 'My DashboardVideoWrapper',
        },
        {
          video: {
            upload_state: uploadState.PROCESSING,
          },
          expectedText: 'My DashboardVideoWrapper',
        },
        {
          video: {
            upload_state: uploadState.PENDING,
          },
          expectedText: 'Create a video',
        },
        {
          video: {
            upload_state: uploadState.INITIALIZED,
          },
          expectedText: 'My CreateVOD',
        },
      ])(
        'with permissions.can_update and video:$video',
        async ({ video, expectedText }) => {
          mockedUseAppConfig.mockReturnValue({
            frontend: 'test',
            modelName: modelName.VIDEOS,
            video,
          } as any);
          mockedUseCurrentResourceContext.mockReturnValue([
            ltiInstructorTokenMockFactory(),
          ] as any);

          render(<LTIInnerRoutes />, {
            routerOptions: {
              history: [`/`],
            },
          });

          expect(await screen.findByText(expectedText)).toBeInTheDocument();
        },
      );

      test.each([
        {
          video: {
            starting_at: true,
          },
          expectedText: 'My PlayerPages',
        },
        {
          video: {
            is_ready_to_show: true,
          },
          expectedText: 'My PlayerPages',
        },
        {
          video: {
            is_ready_to_show: false,
          },
          expectedText: 'My FullScreenError notFound',
        },
      ])(
        'with NOT permissions.can_update and video: $video',
        async ({ video, expectedText }) => {
          mockedUseAppConfig.mockReturnValue({
            frontend: 'test',
            modelName: modelName.VIDEOS,
            video,
          } as any);
          mockedUseCurrentResourceContext.mockReturnValue([
            ltiStudentTokenMockFactory(),
          ] as any);

          render(<LTIInnerRoutes />, {
            routerOptions: {
              history: [`/`],
            },
          });

          expect(await screen.findByText(expectedText)).toBeInTheDocument();
        },
      );
    });
  });
});
