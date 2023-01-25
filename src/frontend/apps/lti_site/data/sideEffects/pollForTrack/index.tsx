import {
  useJwt,
  addResource,
  API_ENDPOINT,
  requestStatus,
  Document,
  fetchWrapper,
  modelName,
  TimedText,
  Video,
  report,
} from 'lib-components';

export async function pollForTrack<
  T extends modelName.TIMEDTEXTTRACKS | modelName.VIDEOS | modelName.DOCUMENTS,
>(
  resourceName: T,
  resourceId: string,
  timer: number = 15,
  counter: number = 1,
): Promise<requestStatus> {
  try {
    const response = await fetchWrapper(
      `${API_ENDPOINT}/${resourceName}/${resourceId}/`,
      {
        headers: {
          Authorization: `Bearer ${useJwt.getState().jwt}`,
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
