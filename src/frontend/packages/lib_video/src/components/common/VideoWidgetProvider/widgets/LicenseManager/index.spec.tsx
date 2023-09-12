import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LicenseManager } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const licenseChoices = [
  { display_name: 'Creative Common By Attribution', value: 'CC_BY' },
  { display_name: 'All rights reserved', value: 'NO_CC' },
];

describe('<LicenseManager />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });

    fetchMock.mock(
      '/api/videos/',
      {
        actions: {
          POST: {
            license: {
              choices: licenseChoices,
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the component with existing license', async () => {
    // Set by default with an All rights reserved license
    const mockedVideo = videoMockFactory();

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LicenseManager />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('License')).toBeInTheDocument();
    const selectButton = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(selectButton).findByText('All rights reserved'),
    ).toBeInTheDocument();
  });

  it('renders the component with no license', async () => {
    // Set by default with an All rights reserved license
    const mockedVideo = videoMockFactory();
    mockedVideo.license = null;

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LicenseManager />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('License')).toBeInTheDocument();
    expect(
      await screen.findByRole('combobox', {
        name: 'Select the license',
      }),
    ).toBeInTheDocument();
  });

  it('renders the component with a license and successfully updates it', async () => {
    // Set by default with an All rights reserved license
    const mockedVideo = videoMockFactory();

    fetchMock.mock(`/api/videos/${mockedVideo.id}/`, 200, { method: 'PATCH' });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LicenseManager />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('License')).toBeInTheDocument();
    const selectButton = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(selectButton).findByText('All rights reserved'),
    ).toBeInTheDocument();
    await userEvent.click(selectButton);
    const CreativeCommonButtonOption = screen.getByRole('option', {
      name: 'Creative Common By Attribution',
    });
    await userEvent.click(CreativeCommonButtonOption);
    expect(
      await within(selectButton).findByText('Creative Common By Attribution'),
    ).toBeInTheDocument();
  });

  it('renders the component with no license choice', async () => {
    // Set by default with an All rights reserved license
    const mockedVideo = videoMockFactory();
    fetchMock.mock('/api/videos/', 500, {
      method: 'OPTIONS',
      overwriteRoutes: true,
    });
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LicenseManager />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('License')).toBeInTheDocument();
    const selectButton = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    await userEvent.click(selectButton);
    await screen.findByText('No license available');
  });

  it('fails to update the video and displays the right error message', async () => {
    // Set by default with an All rights reserved license
    const mockedVideo = videoMockFactory();
    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 401);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LicenseManager />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('License')).toBeInTheDocument();
    const selectButton = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(selectButton).findByText('All rights reserved'),
    ).toBeInTheDocument();
    await userEvent.click(selectButton);
    const CreativeCommonButtonOption = screen.getByRole('option', {
      name: 'Creative Common By Attribution',
    });
    await userEvent.click(CreativeCommonButtonOption);
    await screen.findByText('Video update has failed!');
  });
});
