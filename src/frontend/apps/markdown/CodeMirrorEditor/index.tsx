import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import React, { useEffect } from 'react';

type EditorProps = {
  onEditorContentChange: (newContent: string) => void;
  initialContent: string;
  setCodemirrorView: (view: EditorView) => void;
};

export const CodeMirrorEditor = ({
  onEditorContentChange,
  initialContent,
  setCodemirrorView,
}: EditorProps) => {
  const editorRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current === null) return;
    const state = EditorState.create({
      doc: initialContent,
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
    const view = new EditorView({ state, parent: editorRef.current });
    setCodemirrorView(view);

    return () => {
      view.destroy();
    };
  }, [editorRef.current]);

  return <div style={{ maxHeight: '100%' }} ref={editorRef} />;
};
