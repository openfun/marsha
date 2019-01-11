import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { uploadState } from '../../types/tracks';
import { DashboardVideoPaneButtons } from './DashboardVideoPaneButtons';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<DashboardVideoPaneButtons />', () => {
  it('disables the "Watch" button unless the video is ready', () => {
    // We're testing the "Watch" button
    expect(
      shallow(<DashboardVideoPaneButtons state={READY} />)
        .childAt(1)
        .html(),
    ).toContain('Watch');

    // Can't watch the video before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING, UPLOADING]) {
      expect(
        shallow(<DashboardVideoPaneButtons state={state} />)
          .childAt(1)
          .prop('disabled'),
      ).toBeTruthy();
    }

    expect(
      shallow(<DashboardVideoPaneButtons state={READY} />)
        .childAt(1)
        .prop('disabled'),
    ).not.toBeTruthy();
  });

  it('adapts the text of the "Upload" button to the video state', () => {
    for (const state of [ERROR, PROCESSING, READY, UPLOADING]) {
      expect(
        shallow(<DashboardVideoPaneButtons state={state} />)
          .childAt(0)
          .html(),
      ).toContain('Replace the video');
    }

    expect(
      shallow(<DashboardVideoPaneButtons state={PENDING} />)
        .childAt(0)
        .html(),
    ).toContain('Upload a video');
  });
});
