import { act, render } from '@testing-library/react';
import React, { useEffect } from 'react';

import { useJwt } from '.';

const TestJwtComponent = ({
  renderFnc,
}: {
  renderFnc: (param?: string) => void;
}) => {
  const { jwt } = useJwt((state) => state);
  useEffect(() => {
    renderFnc(jwt);
  }, [renderFnc, jwt]);
  return <div>My content per page is: ${jwt}</div>;
};

describe('useJwt', () => {
  beforeEach(() => {
    useJwt.setState({
      setDecodedJwt: () =>
        useJwt.setState({
          internalDecodedJwt: 'some-internalDecodedJwt' as any,
        }),
    });
  });

  afterEach(() => {
    act(() => {
      useJwt.getState().resetJwt();
    });
  });

  it('Check JWT subscription re rendering', () => {
    const mock = jest.fn();
    const { rerender } = render(<TestJwtComponent renderFnc={mock} />);

    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toBe(undefined);
    expect(useJwt.getState().getJwt()).toEqual(undefined);

    act(() => {
      useJwt.getState().setJwt('some token');
    });
    rerender(<TestJwtComponent renderFnc={mock} />);

    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[1][0]).toBe('some token');
    expect(useJwt.getState().getJwt()).toEqual('some token');

    act(() => {
      useJwt.getState().setJwt('another token');
    });
    rerender(<TestJwtComponent renderFnc={mock} />);
    expect(mock.mock.calls).toHaveLength(3);
    expect(useJwt.getState().getJwt()).toEqual('another token');
    expect(mock.mock.calls[2][0]).toBe('another token');

    rerender(<TestJwtComponent renderFnc={mock} />);
    // Use effect should not be called once more
    expect(mock.mock.calls).toHaveLength(3);
  });

  it('checks change value jwt', () => {
    expect(useJwt.getState().getJwt()).toEqual(undefined);

    useJwt.getState().setJwt('some token');

    expect(useJwt.getState().getJwt()).toEqual('some token');

    useJwt.getState().setJwt('another token');

    expect(useJwt.getState().getJwt()).toEqual('another token');
  });

  it('checks when another tab change jwt if persistent store', () => {
    useJwt.getState().setWithPersistancy(true);
    expect(useJwt.getState().getJwt()).toEqual(undefined);

    useJwt.getState().setJwt('some token');

    expect(useJwt.getState().getJwt()).toEqual('some token');

    localStorage.setItem('JWT', 'another token');

    expect(useJwt.getState().getJwt()).toEqual('another token');
  });

  it('checks refreshJwtBlackListed', () => {
    expect(useJwt.getState().refreshJwtBlackListed).toEqual(undefined);
    useJwt.getState().setRefreshJwtBlackListed('some token');
    expect(useJwt.getState().refreshJwtBlackListed).toEqual('some token');
  });
});
