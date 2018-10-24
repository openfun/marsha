import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { videoState } from '../../types/Video';
import { DashboardButtons } from './DashboardButtons';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = videoState;

describe('<DashboardButtons />', () => {
  it('disables the "Watch" button unless the video is ready', () => {
    // We're testing the "Watch" button
    expect(
      shallow(<DashboardButtons state={READY} />)
        .childAt(1)
        .html(),
    ).toContain('Watch');

    // Can't watch the video before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING, UPLOADING]) {
      expect(
        shallow(<DashboardButtons state={state} />)
          .childAt(1)
          .prop('disabled'),
      ).toBeTruthy();
    }

    expect(
      shallow(<DashboardButtons state={READY} />)
        .childAt(1)
        .prop('disabled'),
    ).not.toBeTruthy();
  });

  it('adapts the text of the "Upload" button to the video state', () => {
    for (const state of [ERROR, PROCESSING, READY, UPLOADING]) {
      expect(
        shallow(<DashboardButtons state={state} />)
          .childAt(0)
          .html(),
      ).toContain('Replace the video');
    }

    expect(
      shallow(<DashboardButtons state={PENDING} />)
        .childAt(0)
        .html(),
    ).toContain('Upload a video');
  });
});
