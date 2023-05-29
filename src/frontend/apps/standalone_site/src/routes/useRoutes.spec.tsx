import { renderHook } from '@testing-library/react-hooks';

import { useContentFeatures } from 'features/Contents';

import { useRoutes } from './useRoutes';

describe('useRoutes', () => {
  it('checks the states are correctly init', () => {
    useContentFeatures.setState({
      featureRoutes: {
        TEST: { label: 'My feature test' },
      } as any,
    });

    const { result } = renderHook(() => useRoutes());

    expect(result.current.LOGIN.path).toBe('/login');
    expect(result.current.CONTENTS.subRoutes.TEST.label).toBe(
      'My feature test',
    );
  });
});
