import { cleanup, render } from '@testing-library/react';
import { Grommet } from 'grommet';
import { GenerateImageOptions, generateImage } from 'jsdom-screenshot';
import { theme } from 'lib-common';
import { wrapInRouter } from 'lib-tests';
import path from 'path';

import { wrapInIntlProvider } from './intl';

import { GlobalStyles } from '../theme/baseStyles';

const checkSnapshot = () => {
  // check if test name contains '[screenshot]'
  if (!expect.getState().currentTestName!.includes('[screenshot]')) {
    throw new Error('[screenshot] is missing from test name');
  }
};

// To disable puppeteer sandbox if needed, launch the test suite
// using DISABLE_PUPPETEER_SANDBOX=1 as environment variable.
// see https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
const disableSandbox = !!process.env.DISABLE_PUPPETEER_SANDBOX;

export const imageSnapshot = async (width?: number, height?: number) => {
  checkSnapshot();
  width = width || 800;
  height = height || 600;
  const generateImageOptions: GenerateImageOptions = {
    viewport: { width, height },
  };
  if (disableSandbox) {
    generateImageOptions.launch = {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
  }
  const screenshot = await generateImage(generateImageOptions);
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
  checkSnapshot();
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
  checkSnapshot();
  await renderImageSnapshot(component, 100, 100);
};
