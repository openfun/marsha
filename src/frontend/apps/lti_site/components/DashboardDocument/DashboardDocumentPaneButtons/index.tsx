import { Box } from 'grommet';
import { builderUploadFormRoute, withLink } from 'lib-components';
import { FormattedMessage, defineMessages } from 'react-intl';

import { PLAYER_ROUTE } from 'components/routes';
import {
  DashboardButton,
  Document,
  modelName,
  uploadState,
  useUploadManager,
} from 'lib-components';

const DashboardButtonWithLink = withLink(DashboardButton);

const messages = defineMessages({
  btnPlay: {
    defaultMessage: 'Display',
    description:
      'Dashboard button to display the existing document, if there is one.',
    id: 'components.Dashboard.DashboardDocumentPaneButtons.btnPlay',
  },
  btnReplace: {
    defaultMessage: 'Replace the document',
    description:
      'Dashboard button to upload a document to replace the existing one, when there *is* an existing document.',
    id: 'components.Dashboard.DashboardDocumentPaneButtons.btnReplace',
  },
  btnUploadFirst: {
    defaultMessage: 'Upload a document',
    description:
      'Dashboard button to upload a document, when there is no existing document.',
    id: 'components.Dashboard.DashboardDocumentPaneButtons.btnUploadFirst',
  },
});

/** Props shape for the DashboardVideoPaneButtons component. */
export interface DashboardDocumentPaneButtonsProps {
  document: Document;
}

/** Component. Displays buttons with links to the Preview & the Form, adapting their state and
 * look to the document's current state.
 * @param document The document for which the pane is displaying information & buttons.
 */
export const DashboardDocumentPaneButtons = ({
  document,
}: DashboardDocumentPaneButtonsProps) => {
  const { uploadManagerState } = useUploadManager();
  const displayWatchBtn = document.upload_state === uploadState.READY;

  return (
    <Box
      direction={'row'}
      justify={displayWatchBtn ? 'center' : 'end'}
      margin={'small'}
    >
      <DashboardButtonWithLink
        label={
          <FormattedMessage
            {...(document.upload_state === uploadState.PENDING &&
            !uploadManagerState[document.id]
              ? messages.btnUploadFirst
              : messages.btnReplace)}
          />
        }
        primary={!displayWatchBtn}
        to={builderUploadFormRoute(modelName.DOCUMENTS, document.id)}
      />
      {displayWatchBtn && (
        <DashboardButtonWithLink
          label={<FormattedMessage {...messages.btnPlay} />}
          primary={displayWatchBtn}
          to={`/${PLAYER_ROUTE.base}/${PLAYER_ROUTE.documents}`}
        />
      )}
    </Box>
  );
};
