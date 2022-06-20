import { Box } from 'grommet';
import styled from 'styled-components';

interface StyledNoSelectElementProps {
  isSelectDisable?: boolean;
}
const disableSelect = (props: StyledNoSelectElementProps) =>
  props.isSelectDisable ? 'none' : 'inherit';
export const StyledNoSelectElement = styled(Box)`
  pointer-events: ${disableSelect};

  -webkit-touch-callout: ${disableSelect};
  -webkit-user-select: ${disableSelect};
  -khtml-user-select: ${disableSelect};
  -moz-user-select: ${disableSelect};
  -ms-user-select: ${disableSelect};
  user-select: ${disableSelect};
`;
