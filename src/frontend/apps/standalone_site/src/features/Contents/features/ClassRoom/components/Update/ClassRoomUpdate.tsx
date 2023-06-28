import { Box } from 'grommet';
import { DashboardClassroom } from 'lib-classroom';
import {
  AppConfig,
  AppConfigProvider,
  CurrentResourceContextProvider,
  isDecodedJwtLTI,
  isDecodedJwtWeb,
  ResourceContext,
  useCurrentResourceContext,
  useJwt,
  useResponsive,
} from 'lib-components';
import { useEffect, useMemo } from 'react';
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
  const { classroomId } = useParams();

  const internalDecodedJwt = useJwt((state) => state.internalDecodedJwt);
  const resourceContext: ResourceContext = useMemo(() => {
    let permissions = {
      can_access_dashboard: false,
      can_update: false,
    };

    if (isDecodedJwtLTI(internalDecodedJwt)) {
      permissions = internalDecodedJwt.permissions;
    } else if (isDecodedJwtWeb(internalDecodedJwt)) {
      permissions = {
        can_access_dashboard: true,
        can_update: true,
      };
    }

    return {
      resource_id: classroomId || '',
      roles: [],
      permissions,
      isFromWebsite: true,
    };
  }, [classroomId, internalDecodedJwt]);

  return (
    <AppConfigProvider value={appConfig}>
      <CurrentResourceContextProvider value={resourceContext}>
        {classroomId && (
          <ClassRoomDashboard
            classroomId={classroomId}
            resourceContext={resourceContext}
          />
        )}
      </CurrentResourceContextProvider>
    </AppConfigProvider>
  );
};

interface ClassRoomUpdateProps {
  classroomId: string;
  resourceContext: ResourceContext;
}

const ClassRoomDashboard = ({
  classroomId,
  resourceContext,
}: ClassRoomUpdateProps) => {
  const { isSmallerBreakpoint, breakpoint } = useResponsive();
  const [, setCurrentRessourceContext] = useCurrentResourceContext();

  useEffect(() => {
    setCurrentRessourceContext(resourceContext);
  }, [resourceContext, setCurrentRessourceContext]);

  return (
    <DashboardClassroomStyled
      isSmallerBreakpoint={isSmallerBreakpoint}
      breakpoint={breakpoint}
    >
      <DashboardClassroom classroomId={classroomId} />
    </DashboardClassroomStyled>
  );
};

export default ClassRoomUpdate;
