import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import SVGIcon from '.';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<SVGIcon />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders SVGIcon component correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <SVGIcon iconColor="#035ccd">
        <g fillRule="evenodd" stroke="none" strokeWidth="1">
          <g transform="translate(2.5 2.5)">
            <path
              fillRule="nonzero"
              d="M8.333 16.667h8.334V8.333H8.333v8.334zm12.5 25h8.334v-8.334h-8.334v8.334zm-12.5 0h8.334v-8.334H8.333v8.334zm0-12.5h8.334v-8.334H8.333v8.334zm12.5 0h8.334v-8.334h-8.334v8.334zm12.5-20.834v8.334h8.334V8.333h-8.334zm-12.5 8.334h8.334V8.333h-8.334v8.334zm12.5 12.5h8.334v-8.334h-8.334v8.334zm0 12.5h8.334v-8.334h-8.334v8.334z"
            ></path>
          </g>
        </g>
      </SVGIcon>,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
