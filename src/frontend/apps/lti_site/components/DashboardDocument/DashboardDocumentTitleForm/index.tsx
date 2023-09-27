import { Input } from '@openfun/cunningham-react';
import { Button, Form } from 'grommet';
import { Maybe } from 'lib-common';
import {
  Document,
  Text,
  modelName,
  updateResource,
  useDocument,
} from 'lib-components';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  updateError: {
    defaultMessage: 'Impossible to update the title. Try again later.',
    description:
      'Error message to warn the user that a title update failed and ask them to try again later.',
    id: 'components.DashboardDocumentTitleForm.form.label.error',
  },
  updateSuccessful: {
    defaultMessage: 'Title successfully updated',
    description: 'message display when the title is successfully updated',
    id: 'components.DashboardDocumentTitleForm.form.success',
  },
  updateTitle: {
    defaultMessage: 'Change document title',
    description: 'Label informing the user they can change the document title.',
    id: 'components.DashboardDocumentTitleForm.form.label.title',
  },
});

interface DashboardDocumentTitleFormProps {
  document: Document;
}

export const DashboardDocumentTitleForm = ({
  document,
}: DashboardDocumentTitleFormProps) => {
  const { updateDocument } = useDocument((state) => ({
    updateDocument: state.addResource,
  }));
  const [title, setTitle] = useState(document.title || '');
  const [error, setError] = useState<Maybe<string>>(undefined);
  const [udpated, setUpdated] = useState(false);
  const intl = useIntl();

  const updateTitle = async () => {
    try {
      setUpdated(false);
      const newDocument = await updateResource(
        {
          ...document,
          title,
        },
        modelName.DOCUMENTS,
      );
      setError(undefined);
      setUpdated(true);
      updateDocument(newDocument);
    } catch (error) {
      setError(intl.formatMessage(messages.updateError));
      setUpdated(false);
    }
  };

  return (
    <Fragment>
      <Form
        onSubmit={() => {
          updateTitle();
        }}
      >
        <Input
          aria-label="Title"
          label={intl.formatMessage(messages.updateTitle)}
          id="title"
          maxLength={255}
          fullWidth
          onChange={(event) => setTitle(event.target.value)}
          value={title}
          required={true}
          state={error ? 'error' : undefined}
          text={error}
        />
        <Button
          type="submit"
          primary
          label="Submit"
          margin={{ top: 'small' }}
        />
        {udpated && (
          <Text
            color="var(--c--theme--colors--success-500)"
            className="ml-s"
            weight="bold"
          >
            {intl.formatMessage(messages.updateSuccessful)}
          </Text>
        )}
      </Form>
    </Fragment>
  );
};
