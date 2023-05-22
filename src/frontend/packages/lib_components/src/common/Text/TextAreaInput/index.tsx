import {
  FormField,
  FormFieldExtendedProps,
  TextArea,
  TextAreaExtendedProps,
} from 'grommet';

interface TextAreaInputProps extends TextAreaExtendedProps {
  setValue: (inputText: string) => void;
  value: string;
  placeholder?: string;
  title?: string;
  formFieldProps?: FormFieldExtendedProps;
}

export const TextAreaInput = ({
  placeholder,
  setValue,
  title,
  value,
  formFieldProps,
  ...textAreaProps
}: TextAreaInputProps) => {
  return (
    <FormField label={placeholder} {...formFieldProps}>
      <TextArea
        a11yTitle={title}
        onChange={(event) => setValue(event.target.value)}
        resize={false}
        spellCheck={false}
        title={title}
        value={value}
        style={{
          minHeight: '150px',
        }}
        onInput={(e) => {
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
        }}
        {...textAreaProps}
      />
    </FormField>
  );
};
