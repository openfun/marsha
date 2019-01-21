import { createGlobalStyle } from 'styled-components';
import reboot from 'styled-reboot';

const rebootCss = reboot();

export const GlobalStyles = createGlobalStyle`
  ${rebootCss};
`;
