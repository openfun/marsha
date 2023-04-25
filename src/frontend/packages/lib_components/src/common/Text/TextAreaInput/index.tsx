import { FormField, TextArea } from 'grommet';
import React from 'react';

interface TextAreaInputProps {
  placeholder?: string;
  setValue: (inputText: string) => void;
  title?: string;
  value: string;
}

export const TextAreaInput = ({
  placeholder,
  setValue,
  title,
  value,
}: TextAreaInputProps) => {
  return (
    <FormField label={placeholder}>
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
      />
    </FormField>
  );
};
