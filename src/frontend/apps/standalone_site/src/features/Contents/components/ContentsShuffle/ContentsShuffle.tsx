import React from 'react';

import { ClassRooms } from 'features/Contents';

const ContentsShuffle = () => {
  return <ClassRooms withPagination={false} limit={5} />;
};

export default ContentsShuffle;
