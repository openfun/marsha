import { Text } from 'grommet';
import React from 'react';

interface MutationFieldErrorProps {
  errors: { [key: string]: string[] | undefined }[];
  fieldName: string;
}

export const MutationFieldError = ({
  errors,
  fieldName,
}: MutationFieldErrorProps) => (
  <React.Fragment>
    {errors
      .filter((errorsObject) => !!errorsObject[fieldName])
      .map((errorObject, index) => (
        <React.Fragment key={index}>
          {errorObject[fieldName]?.map((message) => (
            <Text color="status-error" key="message">
              {message}
            </Text>
          ))}
        </React.Fragment>
      ))}
  </React.Fragment>
);
