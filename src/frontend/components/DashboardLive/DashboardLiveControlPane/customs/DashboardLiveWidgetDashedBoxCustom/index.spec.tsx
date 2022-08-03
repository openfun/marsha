import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import { DashboardLiveWidgetDashedBoxCustom } from './index';

const GenericComponent1 = () => <p>generic component 1</p>;
const GenericComponent2 = () => <p>generic component 2</p>;
const GenericComponent3 = () => <p>generic component 3</p>;

describe('<DashboardLiveWidgetDashedBoxCustom />', () => {
  it('renders DashboardLiveWidgetDashedBoxCustom with one child', () => {
    render(
      <DashboardLiveWidgetDashedBoxCustom>
        <GenericComponent1 />
      </DashboardLiveWidgetDashedBoxCustom>,
    );
    screen.getByText('generic component 1');
  });

  it('renders DashboardLiveWidgetDashedBoxCustom with 3 children', () => {
    render(
      <DashboardLiveWidgetDashedBoxCustom>
        <GenericComponent1 />
        <GenericComponent2 />
        <GenericComponent3 />
      </DashboardLiveWidgetDashedBoxCustom>,
    );
    screen.getByText('generic component 1');
    screen.getByText('generic component 2');
    screen.getByText('generic component 3');
  });
});
