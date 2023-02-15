import React from 'react';

type MarkdownWizardProps = {
  markdownDocumentId: string;
};

export const MarkdownWizard = ({ markdownDocumentId }: MarkdownWizardProps) => {
  return <p>MarkdownWizard for {markdownDocumentId}</p>;
};
