import { injectGlobal } from 'styled-components';
import reboot from 'styled-reboot';

const rebootCss = reboot();

export const baseStyles = () => injectGlobal`
  ${rebootCss}
`;
