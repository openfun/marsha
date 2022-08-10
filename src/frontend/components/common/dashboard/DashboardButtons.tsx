import { Button } from 'grommet';
import styled from 'styled-components';

import { withLink } from 'components/withLink/withLink';

export const DashboardButton = styled(Button)`
  flex-grow: 1;
  flex-basis: 8rem;
  max-width: 50%;
  position: relative;

  :first-child {
    margin-right: 1rem;
  }

  :last-child {
    margin-left: 1rem;
  }
`;

export const DashboardButtonBeta = styled(DashboardButton)`
  :after {
    color: #ff6a00;
    content: '(BETA)';
    font-size: 0.5em;
    position: absolute;
    top: -0.4em;
  }
`;

export const DashboardButtonWithLink = withLink(DashboardButton);
