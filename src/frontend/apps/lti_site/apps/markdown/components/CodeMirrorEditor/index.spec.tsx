import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import { CodeMirrorEditor, useCodemirrorEditor } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('<CodeMirrorEditor>', () => {
  let getLatestHookValues: () => any = () => {};
  const setLocalMarkdownContent = jest.fn();

  const TestComponent = ({ initialContent }: { initialContent: string }) => {
    const codemirrorEditorHooks = useCodemirrorEditor();
    getLatestHookValues = () => codemirrorEditorHooks;

    return (
      <CodeMirrorEditor
        onEditorContentChange={setLocalMarkdownContent}
        initialContent={initialContent}
        codemirrorEditor={codemirrorEditorHooks.codemirrorEditor}
      />
    );
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes the hook properly', async () => {
    const HookOnlyComponent = () => {
      const codemirrorEditorHooks = useCodemirrorEditor();
      getLatestHookValues = () => codemirrorEditorHooks;

      return null;
    };
    render(<HookOnlyComponent />);

    const { codemirrorEditor } = getLatestHookValues();
    expect(codemirrorEditor.current).toBeNull();
  });

  it('renders the editor', async () => {
    render(<TestComponent initialContent={'Some content\nNo big deal'} />);

    expect(screen.getByText('Some content'));
    expect(screen.getByText('No big deal'));

    const { codemirrorEditor } = getLatestHookValues();
    expect(codemirrorEditor.current).not.toBeNull();
  });

  it('inserts text in place', async () => {
    const { container } = render(
      <TestComponent initialContent={'Initial content'} />,
    );

    const { codemirrorEditor, insertText } = getLatestHookValues();
    insertText('[Inserted text]');

    const expectedContent = '[Inserted text]Initial content';

    expect(
      container.getElementsByClassName('cm-activeLine')[0].textContent,
    ).toEqual(expectedContent);

    expect(codemirrorEditor.current.view.state.doc.toString()).toEqual(
      expectedContent,
    );

    expect(setLocalMarkdownContent).toHaveBeenCalledWith(expectedContent);
  });

  it('replaces text once', async () => {
    const { container } = render(
      <TestComponent initialContent={'Initial content and other content'} />,
    );

    const { codemirrorEditor, replaceOnceInDocument } = getLatestHookValues();
    replaceOnceInDocument('\\bcontent\\b', 'text');

    const expectedContent = 'Initial text and other content';

    expect(
      container.getElementsByClassName('cm-activeLine')[0].textContent,
    ).toEqual(expectedContent);

    expect(codemirrorEditor.current.view.state.doc.toString()).toEqual(
      expectedContent,
    );

    expect(setLocalMarkdownContent).toHaveBeenCalledWith(expectedContent);
  });

  it('replaces whole content', async () => {
    const { container } = render(
      <TestComponent
        initialContent={
          'Initial content and other content\nAnd other line eventually'
        }
      />,
    );

    const { codemirrorEditor, replaceEditorWholeContent } =
      getLatestHookValues();
    replaceEditorWholeContent("Where's my content?");

    const expectedContent = "Where's my content?";

    expect(
      container.getElementsByClassName('cm-content')[0].textContent,
    ).toEqual(expectedContent);

    expect(codemirrorEditor.current.view.state.doc.toString()).toEqual(
      expectedContent,
    );

    expect(setLocalMarkdownContent).toHaveBeenCalledWith(expectedContent);
  });
});
