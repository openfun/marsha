import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { RegExpCursor } from '@codemirror/search';
import { EditorState, Text } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { Nullable } from 'lib-common';
import React, { useCallback, useEffect, useRef } from 'react';

type CodeMirrorRef = {
  // This store values for the `useCodemirrorEditor` hook.
  view: EditorView;
};

type EditorProps = {
  onEditorContentChange: (newContent: string) => void;
  initialContent: string;
  codemirrorEditor: React.MutableRefObject<Nullable<CodeMirrorRef>>;
};

export const CodeMirrorEditor = ({
  onEditorContentChange,
  initialContent,
  codemirrorEditor,
}: EditorProps) => {
  const editorDivRef = React.useRef<HTMLDivElement>(null);
  const initialValues = useRef(initialContent);

  useEffect(() => {
    if (editorDivRef.current === null) {
      return;
    }
    const state = EditorState.create({
      doc: initialValues.current,
      extensions: [
        basicSetup,
        keymap.of([...defaultKeymap, indentWithTab]),
        markdown({
          addKeymap: true,
          base: markdownLanguage,
          codeLanguages: languages,
        }),
        EditorView.updateListener.of((v: ViewUpdate) => {
          if (v.docChanged) {
            onEditorContentChange(v.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    });
    const view = new EditorView({ state, parent: editorDivRef.current });
    codemirrorEditor.current = { view };
    return () => {
      view.destroy();
      codemirrorEditor.current = null;
    };
  }, [codemirrorEditor, initialValues, onEditorContentChange]);

  return <div style={{ maxHeight: '100%' }} ref={editorDivRef} />;
};

export const useCodemirrorEditor = () => {
  const codemirrorEditor = React.useRef<Nullable<CodeMirrorRef>>(null);

  const replaceEditorWholeContent = useCallback((content: string | Text) => {
    if (!codemirrorEditor.current) {
      return;
    }

    const update = codemirrorEditor.current.view.state.update({
      changes: {
        from: 0,
        to: codemirrorEditor.current.view.state.doc.length,
        insert: content,
      },
    });
    codemirrorEditor.current.view.update([update]);
    // Warning: this does not clear the state, ie. an "undo"
    // in the editor will restore the previous content (bad
    // when we are talking about language change).
    // `codemirrorView.setState(state)` would be a better solution,
    // but it would be a bad idea not to make it inside the
    // `CodeMirrorEditor` component.
  }, []);

  const insertText = useCallback((text: string | Text) => {
    if (!codemirrorEditor.current) {
      throw new Error('CodeMirrorEditor is not yet available');
    }
    codemirrorEditor.current.view.dispatch(
      codemirrorEditor.current.view.state.update(
        codemirrorEditor.current.view.state.replaceSelection(text),
      ),
    );
  }, []);

  const replaceOnceInDocument = useCallback(
    (contentToReplace: string, newContent: string) => {
      if (!codemirrorEditor.current) {
        throw new Error('CodeMirrorEditor is not yet available');
      }
      const cursor = new RegExpCursor(
        codemirrorEditor.current.view.state.doc,
        contentToReplace,
      );

      cursor.next();

      if (cursor.value.from === -1 || cursor.value.to === -1) {
        return;
      }

      const update = codemirrorEditor.current.view.state.update({
        changes: {
          from: cursor.value.from,
          to: cursor.value.to,
          insert: newContent,
        },
      });
      codemirrorEditor.current.view.update([update]);
    },
    [],
  );

  return {
    codemirrorEditor,
    insertText,
    replaceEditorWholeContent,
    replaceOnceInDocument,
  };
};
