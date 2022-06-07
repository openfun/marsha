import { usePictureInPicture } from 'data/stores/usePictureInPicture';
import { Box, CheckBox, Paragraph } from 'grommet';
import React from 'react';
import { DashboardVideoLiveWidgetTemplate } from '../DashboardVideoLiveWidgetTemplate';

export const PIPWidget = () => {
  const [state, setState] = usePictureInPicture();

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText="WIP pip"
      initialOpenValue
      title="Picture in picture"
    >
      <Box direction="column" fill>
        <Box direction="row">
          <Box flex>
            <Paragraph>reversed</Paragraph>
          </Box>
          <CheckBox
            toggle
            checked={state.reversed}
            onChange={() => {
              setState((currentValue) => ({
                reversed: !currentValue.reversed,
              }));
            }}
          />
        </Box>
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};
