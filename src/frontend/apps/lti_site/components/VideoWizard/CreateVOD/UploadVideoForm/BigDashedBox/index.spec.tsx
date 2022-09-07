import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import { BigDashedBox } from '.';

const GenericComponent1 = () => <p>generic component 1</p>;
const GenericComponent2 = () => <p>generic component 2</p>;
const GenericComponent3 = () => <p>generic component 3</p>;

describe('<BigDashedBox>', () => {
  it('renders BigDashedBox with one child', () => {
    render(
      <BigDashedBox>
        <GenericComponent1 />
      </BigDashedBox>,
    );
    screen.getByText('generic component 1');
  });

  it('renders BigDashedBox with 3 children', () => {
    render(
      <BigDashedBox>
        <GenericComponent1 />
        <GenericComponent2 />
        <GenericComponent3 />
      </BigDashedBox>,
    );
    screen.getByText('generic component 1');
    screen.getByText('generic component 2');
    screen.getByText('generic component 3');
  });
});
