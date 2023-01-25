import { fetchWrapper } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';
import { VTTCue, WebVTT } from 'vtt.js';

export const useTranscriptReaderRequest = (
  url: string,
  onSuccess: (cue: VTTCue) => void,
  queryConfig?: UseQueryOptions<string, 'useTranscriptReaderRequest', string>,
) => {
  return useQuery({
    queryKey: ['useTranscriptReaderRequest'],
    queryFn: async () => {
      const response = await fetchWrapper(url);
      return await response.text();
    },
    onSuccess: (transcriptReader: string) => {
      if (!transcriptReader) {
        return;
      }

      const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());

      parser.oncue = (cue: VTTCue) => {
        onSuccess(cue);
      };

      parser.parse(transcriptReader);
      parser.flush();
    },
    ...queryConfig,
  });
};
