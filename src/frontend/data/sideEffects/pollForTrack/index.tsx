import { Dispatch } from 'redux';

import { API_ENDPOINT } from '../../../settings';
import { requestStatus } from '../../../types/api';
import { Document } from '../../../types/file';
import { modelName } from '../../../types/models';
import { TimedText, Video } from '../../../types/tracks';
import { report } from '../../../utils/errors/report';
import { appData } from '../../appData';
import { addResource } from '../../stores/generics';

export async function pollForTrack<
  T extends modelName.TIMEDTEXTTRACKS | modelName.VIDEOS | modelName.DOCUMENTS,
>(
  resourceName: T,
  resourceId: string,
  timer: number = 15,
  counter: number = 1,
): Promise<requestStatus> {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/${resourceName}/${resourceId}/`,
      {
        headers: {
          Authorization: `Bearer ${appData.jwt}`,
        },
      },
    );

    const incomingTrack: T extends modelName.TIMEDTEXTTRACKS
      ? TimedText
      : T extends modelName.VIDEOS
      ? Video
      : T extends modelName.DOCUMENTS
      ? Document
      : never = await response.json();

    if (incomingTrack.is_ready_to_show) {
      await addResource(resourceName, incomingTrack);
      return requestStatus.SUCCESS;
    } else {
      counter++;
      timer = timer * counter;
      await new Promise((resolve) => window.setTimeout(resolve, 1000 * timer));
      return await pollForTrack(resourceName, resourceId, timer, counter);
    }
  } catch (error) {
    report(error);
    return requestStatus.FAILURE;
  }
}
