import { cleanup, render } from '@testing-library/react';
import { generateImage } from 'jsdom-screenshot';
import { Grommet } from 'grommet';
import React from 'react';
import path from 'path';

import { wrapInIntlProvider } from './intl';
import { wrapInRouter } from './router';
import { theme } from '../theme/theme';
import { GlobalStyles } from '../theme/baseStyles';

export const imageSnapshot = async (width?: number, height?: number) => {
  width = width || 800;
  height = height || 600;
  const screenshot = await generateImage({ viewport: { width, height } });
  expect(screenshot).toMatchImageSnapshot({
    customDiffDir: path.resolve(__dirname, '../../__diff_output__'),
    failureThreshold: 0.01,
    failureThresholdType: 'percent',
  });
};

export const renderImageSnapshot = async (
  component: JSX.Element,
  width?: number,
  height?: number,
) => {
  cleanup();
  render(
    wrapInIntlProvider(
      wrapInRouter(
        <Grommet theme={theme} style={{ height: '100%' }}>
          {component}
          <GlobalStyles />
        </Grommet>,
      ),
    ),
  );
  await imageSnapshot(width, height);
};

export const renderIconSnapshot = async (component: JSX.Element) => {
  await renderImageSnapshot(component, 100, 100);
};
