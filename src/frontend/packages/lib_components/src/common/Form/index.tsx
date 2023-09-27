import {
  Box,
  BoxProps,
  Form as GrommetForm,
  FormExtendedEvent as GrommetFormExtendedEvent,
  FormField as GrommetFormField,
  FormFieldProps as GrommetFormFieldProps,
  FormProps as GrommetFormProps,
} from 'grommet';
import { Maybe } from 'lib-common';
import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useRef,
  useState,
} from 'react';

import { Text, TextProps } from '../Text';

type ErrorStateType<T> = Partial<Record<keyof T, string>>;

const FormErrorContext = createContext<
  { [key: string]: string | undefined } | undefined
>(undefined);
const useFormErrorContext = () => {
  const context = useContext(FormErrorContext);
  if (context === undefined) {
    throw new Error('You are not wrap in FormContext.');
  }

  return context;
};

type CleanFormProps<T> = Omit<GrommetFormProps<T>, 'children' | 'onSubmit'>;
interface FormProps<T = Record<string, unknown>> extends CleanFormProps<T> {
  initialErrors?: ErrorStateType<T>;
  onSubmit: (
    event: GrommetFormExtendedEvent<T, Element>,
  ) => Promise<void> | void;
  onSubmitError: (values: T, error: unknown) => Maybe<ErrorStateType<T>>;
}

export const Form = <T extends Record<string, unknown>>({
  children,
  initialErrors,
  onSubmit,
  onSubmitError,
  ...props
}: PropsWithChildren<FormProps<T>>) => {
  const [errors, setErrors] = useState<ErrorStateType<T>>(initialErrors ?? {});
  const isSubmitOngoing = useRef(false);

  return (
    <GrommetForm
      {...props}
      onSubmit={(submitValues) => {
        const asyncSubmit = async () => {
          if (isSubmitOngoing.current) {
            //  a submit is already in progress
            return;
          }

          isSubmitOngoing.current = true;
          try {
            setErrors({});
            await onSubmit(submitValues);
          } catch (e) {
            setErrors(onSubmitError(submitValues.value, e) ?? {});
          }
          isSubmitOngoing.current = false;
        };

        void asyncSubmit();
      }}
    >
      <FormErrorContext.Provider value={errors}>
        {children}
      </FormErrorContext.Provider>
    </GrommetForm>
  );
};

export const FormField = (props: PropsWithChildren<GrommetFormFieldProps>) => {
  const errors = useFormErrorContext();

  return (
    <GrommetFormField
      error={props.name ? errors[props.name] : undefined}
      {...props}
    >
      {props.children}
    </GrommetFormField>
  );
};

interface FormHelpTextProps {
  boxProps?: BoxProps;
  textProps?: TextProps<'span'>;
  disabled?: boolean;
}

export const FormHelpText = ({
  children,
  boxProps,
  textProps,
  disabled,
}: PropsWithChildren<FormHelpTextProps>) => (
  <Box pad={{ left: 'small' }} margin={{ vertical: '2px' }} {...boxProps}>
    <Text
      size="small"
      color={disabled ? 'clr-greyscale-400' : undefined}
      {...textProps}
    >
      {children}
    </Text>
  </Box>
);
