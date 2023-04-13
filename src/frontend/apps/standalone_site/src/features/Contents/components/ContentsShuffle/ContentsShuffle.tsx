import { Fragment } from 'react';

import { useContentFeatures } from '../../store/contentsStore';

const ContentsShuffle = () => {
  const { featureShuffles } = useContentFeatures((state) => ({
    featureShuffles: state.featureShuffles,
  }));

  return <Fragment>{featureShuffles}</Fragment>;
};

export default ContentsShuffle;
