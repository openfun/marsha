import fetchMock from 'fetch-mock';

import { useContentFeatures } from 'features/Contents';

import featureLoader from './featureLoader';

describe('featureLoader', () => {
  beforeEach(() => {
    useContentFeatures.setState({
      featureRouter: [],
      featureRoutes: {},
      featureSamples: () => [],
      featureShuffles: [],
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should have features active', () => {
    featureLoader([]);

    expect(useContentFeatures.getState().featureRouter).toEqual(
      expect.arrayContaining([
        expect.anything(),
        expect.anything(),
        expect.anything(),
      ]),
    );
    expect(useContentFeatures.getState().featureRoutes).toEqual({
      VIDEO: expect.any(Object),
      LIVE: expect.any(Object),
      CLASSROOM: expect.any(Object),
    });
    expect(useContentFeatures.getState().featureSamples()).toEqual([
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
    ]);
    expect(useContentFeatures.getState().featureShuffles).toEqual([
      expect.anything(),
    ]);
  });

  it('should inactive features', () => {
    featureLoader(['classroom', 'webinar', 'video']);

    expect(useContentFeatures.getState().featureRouter).toEqual([]);
    expect(useContentFeatures.getState().featureRoutes).toEqual({});
    expect(useContentFeatures.getState().featureSamples()).toEqual([]);
    expect(useContentFeatures.getState().featureShuffles).toEqual([]);
  });
});
