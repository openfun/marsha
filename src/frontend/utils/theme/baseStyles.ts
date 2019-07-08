import { createGlobalStyle } from 'styled-components';
import reboot from 'styled-reboot';

const rebootCss = reboot({
  enablePointerCursorForButtons: true,
});

export const GlobalStyles = createGlobalStyle`
  ${rebootCss};
`;
