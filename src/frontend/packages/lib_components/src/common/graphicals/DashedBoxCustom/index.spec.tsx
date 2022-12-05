import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

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

    expect(screen.getByText('generic component 1')).toBeInTheDocument();
  });

  it('renders DashedBoxCustom with 3 children', () => {
    render(
      <DashedBoxCustom>
        <GenericComponent1 />
        <GenericComponent2 />
        <GenericComponent3 />
      </DashedBoxCustom>,
    );

    expect(screen.getByText('generic component 1')).toBeInTheDocument();
    expect(screen.getByText('generic component 2')).toBeInTheDocument();
    expect(screen.getByText('generic component 3')).toBeInTheDocument();
  });
});
