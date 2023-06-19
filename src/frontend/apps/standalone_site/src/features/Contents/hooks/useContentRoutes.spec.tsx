import { renderHook } from '@testing-library/react';

import { useContentFeatures } from '../store/contentsStore';

import useContentRoutes from './useContentRoutes';

describe('useContentRoutes', () => {
  it('checks the states are correctly init', () => {
    useContentFeatures.setState({
      featureRoutes: {
        TEST: { label: 'My feature test' },
      } as any,
    });

    const { result } = renderHook(() => useContentRoutes());

    expect(result.current.CONTENTS.path).toBe('/my-contents');
    expect(result.current.CONTENTS.subRoutes.TEST.label).toBe(
      'My feature test',
    );
  });
});
