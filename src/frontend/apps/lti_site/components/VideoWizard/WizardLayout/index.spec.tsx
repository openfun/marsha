import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import { WizardLayout } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        videoWizardBackground: 'img/path/videoWizardBackground',
        marshaWhiteLogo: 'img/path/marshaWhiteLogo',
      },
    },
  }),
}));

const TestComponent = () => <p>Test component</p>;

describe('<WizardLayout />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders WizardLayout on a large screen', () => {
    const { container } = render(
      <WizardLayout>
        <TestComponent />
      </WizardLayout>,
      {
        grommetOptions: {
          responsiveSize: 'large',
        },
      },
    );
    screen.getByText('Test component');

    expect(
      container.querySelector('img[src="img/path/videoWizardBackground"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('img[src="img/path/marshaWhiteLogo"]'),
    ).not.toBeNull();
  });

  it('renders WizardLayout on a small screen', () => {
    const { container } = render(
      <WizardLayout>
        <TestComponent />
      </WizardLayout>,
      {
        grommetOptions: {
          responsiveSize: 'small',
        },
      },
    );

    expect(
      container.querySelector('img[src="img/path/videoWizardBackground"]'),
    ).toBeNull();
    expect(
      container.querySelector('img[src="img/path/marshaWhiteLogo"]'),
    ).toBeNull();
  });
});
