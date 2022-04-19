import { Box, Button, Collapsible, Text } from 'grommet';
import React, { useState } from 'react';
import styled from 'styled-components';

import { DownArrowSVG } from 'components/SVGIcons/DownArrowSVG';
import { InfoCircleSVG } from 'components/SVGIcons/InfoCircleSVG';
import { DashboardVideoLiveInfoModal } from 'components/DashboardVideoLiveInfoModal';

const StyledTitleText = styled(Text)`
  font-family: 'Roboto-Bold';
`;

interface DashboardVideoLiveWidgetTemplateProps {
  children: React.ReactNode;
  infoText?: string;
  initialOpenValue: boolean;
  title: string;
}

export const DashboardVideoLiveWidgetTemplate = ({
  children,
  infoText,
  initialOpenValue,
  title,
}: DashboardVideoLiveWidgetTemplateProps) => {
  const [open, setOpen] = useState(initialOpenValue);
  const [showInfoTextModal, setShowInfoTextModal] = useState(false);

  return (
    <Box
      background="white"
      direction="column"
      round="6px"
      style={{
        boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
        minHeight: '70px',
      }}
    >
      <Box pad={{ horizontal: '6px', top: '6px' }}>
        <Button
          disabled={!infoText}
          margin={{ left: 'auto' }}
          onClick={() => setShowInfoTextModal(true)}
          plain
          style={{ display: 'flex', padding: 0 }}
        >
          <InfoCircleSVG height="17px" iconColor="blue-active" width="17px" />
        </Button>
      </Box>

      {infoText && showInfoTextModal && (
        <DashboardVideoLiveInfoModal
          text={infoText}
          title={title}
          onModalClose={() => setShowInfoTextModal(false)}
        />
      )}

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
