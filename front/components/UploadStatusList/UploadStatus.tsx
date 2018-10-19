import * as React from 'react';
import styled from 'styled-components';

import { styledComponentWithProps } from '../../utils/styledComponentsTs';
import { colors } from '../../utils/theme/theme';
import { Loader } from '../Loader/Loader';

export const UploadStatusStyled = styledComponentWithProps<{
  isHighlighted?: boolean;
}>(styled.li)`
  flex-grow: 1;
  text-align: center;

  ${({ isHighlighted }) =>
    isHighlighted
      ? `
    color: ${colors.primary.main};
    font-weight: 700;
  `
      : `
    color: ${colors.mediumTextGray.main};
  `}
`;

/** Available icon names for statusIcon on the UploadStatus component. */
export enum statusIconKey {
  LOADER = 'loader',
  TICK = 'tick',
}

/** Props shape for the UploadStatus component. */
export interface UploadStatusProps {
  isHighlighted?: boolean;
  statusIcon?: statusIconKey;
}

/** Component. Displays one word status information along with an optional icon.
 * @param isHighlighted Whether to highlight this status by changing its color.
 * @param statusIcon The key for an icon to display along with the status.
 */
export class UploadStatus extends React.Component<UploadStatusProps> {
  render() {
    const { children, statusIcon, isHighlighted } = this.props;

    let icon;
    switch (statusIcon) {
      case statusIconKey.LOADER:
        icon = <Loader />;
        break;

      case statusIconKey.TICK:
        icon = '✓';
        break;
    }

    return (
      <UploadStatusStyled isHighlighted={isHighlighted}>
        {children}
        {icon}
      </UploadStatusStyled>
    );
  }
}
