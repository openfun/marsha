import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

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
    const textbox = await screen.findByRole('textbox', {
      name: 'Select the license under which you want to publish your video, NO_CC',
    });
    expect(textbox).toHaveValue('All rights reserved');
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
    const textbox = await screen.findByRole('textbox', {
      name: 'Select the license under which you want to publish your video',
    });
    expect(textbox).toHaveValue('');
  });

  it('renders the component with a license and successfully updates it', async () => {
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
    const selectButton = await screen.findByRole('button', {
      name: 'Select the license under which you want to publish your video; Selected: NO_CC',
    });
    userEvent.click(selectButton);
    const CreativeCommonButtonOption = screen.getByRole('option', {
      name: 'Creative Common By Attribution',
    });
    userEvent.click(CreativeCommonButtonOption);
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', {
          name: 'Select the license under which you want to publish your video, CC_BY',
        }),
      ).toHaveValue('Creative Common By Attribution'),
    );
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
    const selectButton = await screen.findByRole('button', {
      name: 'Select the license under which you want to publish your video; Selected: All rights reserved',
    });
    userEvent.click(selectButton);
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
    const selectButton = await screen.findByRole('button', {
      name: 'Select the license under which you want to publish your video; Selected: NO_CC',
    });
    userEvent.click(selectButton);
    const CreativeCommonButtonOption = screen.getByRole('option', {
      name: 'Creative Common By Attribution',
    });
    userEvent.click(CreativeCommonButtonOption);
    await screen.findByText('Video update has failed !');
  });
});
