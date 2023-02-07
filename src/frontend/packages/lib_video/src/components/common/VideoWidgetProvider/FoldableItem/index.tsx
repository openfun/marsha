import { Box, Button, Collapsible, Text } from 'grommet';
import { DownArrowSVG, InfoCircleSVG } from 'lib-components';
import React, { useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useInfoWidgetModal } from 'hooks/useInfoWidgetModal';

const messages = defineMessages({
  helpButtonTitle: {
    defaultMessage: 'help',
    description: 'title for widget help button',
    id: 'components.WidgetTemplate.helpButtonTitle',
  },
});

const StyledTitleText = styled(Text)`
  font-family: 'Roboto-Bold';
`;

interface WidgetTemplateProps {
  children: React.ReactNode;
  infoText?: string;
  initialOpenValue: boolean;
  title: string;
}

export const FoldableItem = ({
  children,
  infoText,
  initialOpenValue,
  title,
}: WidgetTemplateProps) => {
  const intl = useIntl();
  const [open, setOpen] = useState(initialOpenValue);
  const [_, setInfoWidgetModalProvider] = useInfoWidgetModal();
  const refWidget = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={refWidget}
      background="white"
      direction="column"
      round="6px"
      style={{
        boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
        minHeight: '70px',
      }}
      margin="small"
    >
      <Box pad={{ horizontal: '6px', top: '6px' }}>
        <Button
          disabled={!infoText}
          margin={{ left: 'auto' }}
          onClick={() => {
            if (!infoText) {
              //  this should not happen since button is disabled
              return;
            }

            setInfoWidgetModalProvider({
              text: infoText,
              title,
              refWidget: refWidget.current,
            });
          }}
          plain
          style={{ display: 'flex', padding: 0 }}
          a11yTitle={intl.formatMessage(messages.helpButtonTitle)}
          title={intl.formatMessage(messages.helpButtonTitle)}
        >
          <InfoCircleSVG height="17px" iconColor="blue-active" width="17px" />
        </Button>
      </Box>

      <Box pad={{ horizontal: '20px' }}>
        <Button onClick={() => setOpen(!open)} plain style={{ padding: 0 }}>
          <Box align="center" direction="row" gap="25px">
            <Box>
              <DownArrowSVG
                containerStyle={{
                  transform: open ? undefined : 'rotate(-90deg)',
                  transition: '150ms linear all',
                }}
                iconColor="blue-active"
                height="9px"
                width="14.5px"
              />
            </Box>
            <Box style={{ minWidth: '0' }}>
              <StyledTitleText color="blue-active" size="1.125rem" truncate>
                {title}
              </StyledTitleText>
            </Box>
          </Box>
        </Button>
      </Box>

      <Collapsible open={open}>
        <Box pad="33px">{children}</Box>
      </Collapsible>
    </Box>
  );
};
