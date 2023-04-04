import { Box } from 'grommet';
import { DashboardClassroom } from 'lib-classroom';
import {
  AppConfig,
  AppConfigProvider,
  CurrentResourceContextProvider,
  DecodedJwtPermission,
  isDecodedJwtLTI,
  isDecodedJwtWeb,
  ResourceContext,
  useJwt,
  useResponsive,
} from 'lib-components';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import bbbBackground from 'assets/img/bbbBackground.png';
import bbbLogo from 'assets/img/bbbLogo.png';
import { themeExtend } from 'styles/theme.extend';

const appConfig = {
  static: {
    img: {
      bbbBackground,
      bbbLogo,
    },
  },
} as AppConfig;

interface DashboardClassroomStyledProps {
  isSmallerBreakpoint: (
    breakpointSmaller: string,
    breakpointBigger: string,
  ) => boolean;
  breakpoint: string;
}

const DashboardClassroomStyled = styled(Box)<DashboardClassroomStyledProps>`
  & .DashboardClassroomAskUsername {
    border-radius: 1rem;
    background-color: #ffffff;
    box-shadow: ${themeExtend.global.elevation.light.even};
  }
  & .DashboardClassroomLayout {
    border-radius: 1rem;
  }
  & .DashboardClassroomLayout .classroom-edit-submit button {
    font-size: 16px;
    padding: 1rem;
    line-height: 1.6rem;
  }
  ${({ isSmallerBreakpoint, breakpoint }) =>
    isSmallerBreakpoint(breakpoint, 'smedium') &&
    `
      & .DashboardClassroomLayout > div {
        display: flex;
        flex-direction: column;
      }
      & .DashboardClassroomLayout .classroom-edit-submit > button {
        width: 75%;
        margin: auto;
      }
    `}
  ${({ isSmallerBreakpoint, breakpoint }) =>
    isSmallerBreakpoint(breakpoint, 'xsmall') &&
    `
      & .DashboardClassroomInfos span {
        font-size: 12px;
      }
    `}
`;

const ClassRoomUpdate = () => {
  const { classroomId } = useParams<{ classroomId?: string }>();
  const { isSmallerBreakpoint, breakpoint } = useResponsive();

  const decodedJwt = useJwt((state) => state.getDecodedJwt);

  const [permissions, setPermissions] = useState<DecodedJwtPermission>({
    can_access_dashboard: false,
    can_update: false,
  });

  useEffect(() => {
    const jwt = decodedJwt();
    if (isDecodedJwtLTI(jwt)) {
      setPermissions(jwt.permissions);
    } else if (isDecodedJwtWeb(jwt)) {
      setPermissions({
        can_access_dashboard: true,
        can_update: true,
      });
    }
  }, [decodedJwt]);

  if (!classroomId) {
    return null;
  }

  const resourceContext: ResourceContext = {
    resource_id: classroomId,
    roles: [],
    permissions: permissions,
    isFromWebsite: true,
  };

  return (
    <AppConfigProvider value={appConfig}>
      <CurrentResourceContextProvider value={resourceContext}>
        <DashboardClassroomStyled
          isSmallerBreakpoint={isSmallerBreakpoint}
          breakpoint={breakpoint}
        >
          <DashboardClassroom classroomId={classroomId} />
        </DashboardClassroomStyled>
      </CurrentResourceContextProvider>
    </AppConfigProvider>
  );
};

export default ClassRoomUpdate;
