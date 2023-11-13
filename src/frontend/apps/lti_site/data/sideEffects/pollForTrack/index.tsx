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

type PollForTrackType<T> = T extends modelName.TIMEDTEXTTRACKS
  ? TimedText
  : T extends modelName.VIDEOS
    ? Video
    : T extends modelName.DOCUMENTS
      ? Document
      : never;

export async function pollForTrack<
  T extends modelName.TIMEDTEXTTRACKS | modelName.VIDEOS | modelName.DOCUMENTS,
>(
  resourceName: T,
  resourceId: string,
  timer = 15,
  counter = 1,
): Promise<requestStatus> {
  const jwt = useJwt.getState().getJwt();
  if (!jwt) {
    throw new Error('No JWT token found');
  }

  try {
    const response = await fetchWrapper(
      `${API_ENDPOINT}/${resourceName}/${resourceId}/`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    );

    const incomingTrack = (await response.json()) as PollForTrackType<T>;

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
