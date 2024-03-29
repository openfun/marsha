import { IFetchResponseError, Text } from 'lib-components';
import React from 'react';

interface MutationFieldErrorProps<T> {
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
              <Text color="clr-danger-300" key={message}>
                {message}
              </Text>
            ))}
          </React.Fragment>
        ))}
  </React.Fragment>
);
