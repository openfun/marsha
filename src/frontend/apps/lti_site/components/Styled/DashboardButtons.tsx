import { Button } from 'grommet';
import styled from 'styled-components';

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
