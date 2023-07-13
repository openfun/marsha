import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { ObjectProgress, useObjectProgress } from '.';

describe('stores/useObjectProgress', () => {
  let setObjectProgress: any;
  const ControlComponent = () => {
    setObjectProgress = useObjectProgress((state) => state.setObjectProgress);
    return null;
  };

  it('manages object progress with react state', () => {
    let objectProgress: ObjectProgress;
    const TestComponent = () => {
      objectProgress = useObjectProgress((state) => state.objectProgress);
      return <span>{objectProgress['42'] || 0}</span>;
    };

    render(<TestComponent />);
    expect(objectProgress!['42']).toEqual(undefined);
    screen.getByText('0');

    render(<ControlComponent />);
    act(() => setObjectProgress('42', 13));
    expect(objectProgress!['42']).toEqual(13);
    screen.getByText('13');

    act(() => setObjectProgress('42', 66));
    expect(objectProgress!['42']).toEqual(66);
    screen.getByText('66');
  });
});
