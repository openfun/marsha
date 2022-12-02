import React from 'react';

import { ClassRooms } from 'features/Contents';

function ContentsShuffle() {
  return <ClassRooms withPagination={false} limit={5} />;
}

export default ContentsShuffle;
