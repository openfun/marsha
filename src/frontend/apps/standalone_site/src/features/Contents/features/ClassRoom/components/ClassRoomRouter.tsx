import { Fragment } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { Text404 } from 'components/Text';

import routes from '../routes';

import ClassroomManage from './Manage/ClassroomManage';
import ClassRooms from './Read/ClassRooms';
import ClassRoomUpdate from './Update/ClassRoomUpdate';

const ClassRoomRouter = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const playlistId = searchParams.get('playlist') || '';

  const classroomRoute = routes.CLASSROOM;
  const classroomCreatePath = classroomRoute.subRoutes.CREATE.pathKey || '';
  const classroomUpdatePath = classroomRoute.subRoutes.UPDATE.pathKey || '';
  const classroomInvitePath = classroomRoute.subRoutes.INVITE.pathKey || '';

  return (
    <Routes>
      {[`${classroomCreatePath}/*`, ''].map((path, index) => {
        return (
          <Route
            path={path}
            element={
              <Fragment>
                <ClassroomManage />
                <ClassRooms playlistId={playlistId} />
              </Fragment>
            }
            key={`${path}-${index}`}
          />
        );
      })}
      {[classroomInvitePath, classroomUpdatePath].map((path, index) => {
        return (
          <Route
            path={path}
            element={<ClassRoomUpdate />}
            key={`${path}-${index}`}
          />
        );
      })}
      <Route path="*" element={<Text404 />} />
    </Routes>
  );
};

export default ClassRoomRouter;
