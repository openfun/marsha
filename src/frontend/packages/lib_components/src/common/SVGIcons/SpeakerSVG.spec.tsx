import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { SpeakerSVG } from './SpeakerSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<SpeakerSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders SpeakerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SpeakerSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders SpeakerSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <SpeakerSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
