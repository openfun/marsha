import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { uploadState, Video } from '../../types/tracks';
import { DashboardVideoPaneButtons } from './DashboardVideoPaneButtons';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<DashboardVideoPaneButtons />', () => {
  it('only renders the "Watch" button if the video is ready', () => {
    // We're testing the "Watch" button
    expect(
      shallow(
        <DashboardVideoPaneButtons video={{ upload_state: READY } as Video} />,
      )
        .childAt(1)
        .exists(),
    ).toBe(true);

    // Can't watch the video before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING, UPLOADING]) {
      expect(
        shallow(
          <DashboardVideoPaneButtons
            video={{ upload_state: state } as Video}
          />,
        )
          .childAt(1)
          .exists(),
      ).not.toBe(true);
    }
  });

  it('adapts the text & color of the "Upload" button to the video state', () => {
    let uploadButton;

    uploadButton = shallow(
      <DashboardVideoPaneButtons video={{ upload_state: PENDING } as Video} />,
    ).childAt(0);
    expect(uploadButton.html()).toContain('Upload a video');
    expect(uploadButton.prop('primary')).toBe(true);

    uploadButton = shallow(
      <DashboardVideoPaneButtons
        video={{ upload_state: UPLOADING } as Video}
      />,
    ).childAt(0);
    expect(uploadButton.html()).toContain('Replace the video');
    expect(uploadButton.prop('primary')).toBe(true);

    uploadButton = shallow(
      <DashboardVideoPaneButtons
        video={{ upload_state: PROCESSING } as Video}
      />,
    ).childAt(0);
    expect(uploadButton.html()).toContain('Replace the video');
    expect(uploadButton.prop('primary')).toBe(true);

    uploadButton = shallow(
      <DashboardVideoPaneButtons video={{ upload_state: READY } as Video} />,
    ).childAt(0);
    expect(uploadButton.html()).toContain('Replace the video');
    expect(uploadButton.prop('primary')).not.toBe(true);

    uploadButton = shallow(
      <DashboardVideoPaneButtons video={{ upload_state: ERROR } as Video} />,
    ).childAt(0);
    expect(uploadButton.html()).toContain('Replace the video');
    expect(uploadButton.prop('primary')).toBe(true);
  });
});
