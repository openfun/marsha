import { render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardVideoLiveWidgetDashedBoxCustom } from './index';

const GenericComponent1 = () => <p>generic component 1</p>;
const GenericComponent2 = () => <p>generic component 2</p>;
const GenericComponent3 = () => <p>generic component 3</p>;

describe('<DashboardVideoLiveWidgetDashedBoxCustom />', () => {
  it('renders DashboardVideoLiveWidgetDashedBoxCustom with one child', () => {
    render(
      <DashboardVideoLiveWidgetDashedBoxCustom>
        <GenericComponent1 />
      </DashboardVideoLiveWidgetDashedBoxCustom>,
    );
    screen.getByText('generic component 1');
  });

  it('renders DashboardVideoLiveWidgetDashedBoxCustom with 3 children', () => {
    render(
      <DashboardVideoLiveWidgetDashedBoxCustom>
        <GenericComponent1 />
        <GenericComponent2 />
        <GenericComponent3 />
      </DashboardVideoLiveWidgetDashedBoxCustom>,
    );
    screen.getByText('generic component 1');
    screen.getByText('generic component 2');
    screen.getByText('generic component 3');
  });
});
