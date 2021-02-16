import { API_ENDPOINT } from '../../../settings';
import { RequestStatus } from '../../../types/api';
import { Document } from '../../../types/file';
import { ModelName } from '../../../types/models';
import { TimedText, Video } from '../../../types/tracks';
import { report } from '../../../utils/errors/report';
import { appData } from '../../appData';
import { addResource } from '../../stores/generics';

export async function pollForTrack<
  T extends ModelName.TIMEDTEXTTRACKS | ModelName.VIDEOS | ModelName.DOCUMENTS
>(
  resourceName: T,
  resourceId: string,
  timer: number = 15,
  counter: number = 1,
): Promise<RequestStatus> {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/${resourceName}/${resourceId}/`,
      {
        headers: {
          Authorization: `Bearer ${appData.jwt}`,
        },
      },
    );

    const incomingTrack: T extends ModelName.TIMEDTEXTTRACKS
      ? TimedText
      : T extends ModelName.VIDEOS
      ? Video
      : T extends ModelName.DOCUMENTS
      ? Document
      : never = await response.json();

    if (incomingTrack.is_ready_to_show) {
      await addResource(resourceName, incomingTrack);
      return RequestStatus.SUCCESS;
    } else {
      counter++;
      timer *= counter;
      await new Promise((resolve) => window.setTimeout(resolve, 1000 * timer));
      return await pollForTrack(resourceName, resourceId, timer, counter);
    }
  } catch (error) {
    report(error);
    return RequestStatus.FAILURE;
  }
}
