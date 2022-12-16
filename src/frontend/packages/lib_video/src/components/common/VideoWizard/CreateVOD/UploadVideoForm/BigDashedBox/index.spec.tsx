import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

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

    expect(screen.getByText('generic component 1')).toBeInTheDocument();
  });

  it('renders BigDashedBox with 3 children', () => {
    render(
      <BigDashedBox>
        <GenericComponent1 />
        <GenericComponent2 />
        <GenericComponent3 />
      </BigDashedBox>,
    );

    expect(screen.getByText('generic component 1')).toBeInTheDocument();
    expect(screen.getByText('generic component 2')).toBeInTheDocument();
    expect(screen.getByText('generic component 3')).toBeInTheDocument();
  });
});
