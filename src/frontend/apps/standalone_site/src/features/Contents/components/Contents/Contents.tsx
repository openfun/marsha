import { Box } from 'grommet';

import { useContentFeatures } from '../../store/contentsStore';

const Contents = () => {
  const { featureSamples } = useContentFeatures((state) => ({
    featureSamples: state.featureSamples,
  }));

  return <Box margin={{ top: 'medium' }}>{featureSamples}</Box>;
};

export default Contents;
