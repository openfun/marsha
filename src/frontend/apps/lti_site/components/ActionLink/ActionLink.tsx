import { Button, ButtonProps } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { colors, theme } from 'lib-common';
import React from 'react';
import styled from 'styled-components';

interface Props {
  color: keyof typeof colors;
}

const ActionLinkStyled = styled(Button)`
  color: ${({ color }: Props) => normalizeColor(color, theme)};

  :hover {
    text-decoration: underline;
  }
`;

/**
 * Component. Personalize the color on a plain buttons to make them more useful.
 * @param color Font color for the plain button as defined in the theme globals.
 */
export const ActionLink = (
  props: ButtonProps & JSX.IntrinsicElements['button'],
) => <ActionLinkStyled plain={true} {...(props as any)} />;
