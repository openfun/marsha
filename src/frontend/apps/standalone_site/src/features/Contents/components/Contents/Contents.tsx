import { Box } from 'grommet';

import { useContentFeatures } from '../../store/contentsStore';

interface ContentsProps {
  playlistId?: string;
}

const Contents = ({ playlistId }: ContentsProps) => {
  const { featureSamples } = useContentFeatures((state) => ({
    featureSamples: state.featureSamples,
  }));

  return <Box margin={{ top: 'medium' }}>{featureSamples(playlistId)}</Box>;
};

export default Contents;
