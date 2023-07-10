import {
  API_ENDPOINT,
  Document,
  TimedText,
  Video,
  addResource,
  fetchWrapper,
  modelName,
  report,
  requestStatus,
  useJwt,
} from 'lib-components';

export async function pollForTrack<
  T extends modelName.TIMEDTEXTTRACKS | modelName.VIDEOS | modelName.DOCUMENTS,
>(
  resourceName: T,
  resourceId: string,
  timer = 15,
  counter = 1,
): Promise<requestStatus> {
  try {
    const response = await fetchWrapper(
      `${API_ENDPOINT}/${resourceName}/${resourceId}/`,
      {
        headers: {
          Authorization: `Bearer ${useJwt.getState().getJwt()}`,
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
