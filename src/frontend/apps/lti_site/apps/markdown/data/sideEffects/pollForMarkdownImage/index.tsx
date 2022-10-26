import { MarkdownImage, report } from 'lib-components';
import { fetchOneMarkdownImage } from 'apps/markdown/data/queries';

export async function pollForMarkdownImage(
  resourceId: string,
  timer: number = 15,
  counter: number = 1,
): Promise<MarkdownImage> {
  try {
    const image = await fetchOneMarkdownImage(resourceId);

    if (image.is_ready_to_show) {
      return image;
    } else {
      counter++;
      timer = timer * counter;
      await new Promise((resolve) => window.setTimeout(resolve, 100 * timer));
      return await pollForMarkdownImage(resourceId, timer, counter);
    }
  } catch (error) {
    report(error);
    throw error;
  }
}
