import { Text } from 'grommet';
import { IFetchResponseError } from 'lib-components';
import React from 'react';

interface MutationFieldErrorProps<T extends unknown> {
  errors: IFetchResponseError<T>['errors'];
  fieldName: keyof T;
}

export const MutationFieldError = <T,>({
  errors,
  fieldName,
}: MutationFieldErrorProps<T>) => (
  <React.Fragment>
    {errors &&
      errors
        .filter((errorsObject) => !!errorsObject[fieldName])
        .map((errorObject, index) => (
          <React.Fragment key={index}>
            {errorObject[fieldName]?.map((message) => (
              <Text color="status-error" key={message}>
                {message}
              </Text>
            ))}
          </React.Fragment>
        ))}
  </React.Fragment>
);
