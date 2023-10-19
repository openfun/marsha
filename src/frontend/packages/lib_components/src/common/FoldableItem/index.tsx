import { Box, Collapsible } from 'grommet';
import React, { useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DownArrowSVG } from '@lib-components/common/SVGIcons/DownArrowSVG';
import { useInfoWidgetModal } from '@lib-components/hooks/stores/useInfoWidgetModal';

import { ButtonBox } from '../Button/ButtonBox';
import { Heading } from '../Headings';
import { InfoCircleSVG } from '../SVGIcons/InfoCircleSVG';

const messages = defineMessages({
  helpButtonTitle: {
    defaultMessage: 'help',
    description: 'title for widget help button',
    id: 'components.WidgetTemplate.helpButtonTitle',
  },
});

interface WidgetTemplateProps {
  children: React.ReactNode;
  infoText?: string;
  initialOpenValue: boolean;
  title: string;
  cardStyle?: boolean;
}

export const FoldableItem = ({
  children,
  infoText,
  initialOpenValue,
  title,
  cardStyle = true,
}: WidgetTemplateProps) => {
  const intl = useIntl();
  const [open, setOpen] = useState(initialOpenValue);
  const [_, setInfoWidgetModalProvider] = useInfoWidgetModal();
  const refWidget = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={refWidget}
      background={cardStyle ? 'white' : 'transparent'}
      direction="column"
      round={cardStyle ? '6px' : '0'}
      style={
        cardStyle
          ? {
              boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
              minHeight: '70px',
            }
          : undefined
      }
      margin="small"
    >
      {infoText && (
        <InfoCircleSVG
          height="17px"
          width="17px"
          iconColor="blue-active"
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
          className="ml-auto pt-t pl-t pr-t"
          style={{ display: 'flex' }}
          aria-label={intl.formatMessage(messages.helpButtonTitle)}
        />
      )}

      <Box pad={{ horizontal: '20px' }}>
        <ButtonBox onClick={() => setOpen(!open)} style={{ padding: 0 }}>
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
              <Heading level={3} truncate className="m-0">
                {title}
              </Heading>
            </Box>
          </Box>
        </ButtonBox>
      </Box>

      <Collapsible open={open}>
        <Box pad={cardStyle ? '33px' : '0'}>{children}</Box>
      </Collapsible>
    </Box>
  );
};
