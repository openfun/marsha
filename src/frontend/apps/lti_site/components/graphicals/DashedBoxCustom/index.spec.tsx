import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import { DashedBoxCustom } from './index';

const GenericComponent1 = () => <p>generic component 1</p>;
const GenericComponent2 = () => <p>generic component 2</p>;
const GenericComponent3 = () => <p>generic component 3</p>;

describe('<DashedBoxCustom />', () => {
  it('renders DashedBoxCustom with one child', () => {
    render(
      <DashedBoxCustom>
        <GenericComponent1 />
      </DashedBoxCustom>,
    );
    screen.getByText('generic component 1');
  });

  it('renders DashedBoxCustom with 3 children', () => {
    render(
      <DashedBoxCustom>
        <GenericComponent1 />
        <GenericComponent2 />
        <GenericComponent3 />
      </DashedBoxCustom>,
    );
    screen.getByText('generic component 1');
    screen.getByText('generic component 2');
    screen.getByText('generic component 3');
  });
});
