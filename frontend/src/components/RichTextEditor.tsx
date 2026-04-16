import { useId } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'blockquote',
  'list',
  'bullet',
  'link',
  'image',
  'video',
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here...',
}: RichTextEditorProps) {
  const toolbarId = useId().replace(/:/g, '');

  return (
    <div className="rich-editor rounded-xl border border-purple-700/50 bg-purple-900/40">
      <div id={toolbarId} className="rich-editor-toolbar">
        <span className="ql-formats">
          <button type="button" className="ql-header rich-editor-text-button" value="">
            P
          </button>
          <button type="button" className="ql-header rich-editor-text-button" value="1">
            H1
          </button>
          <button type="button" className="ql-header rich-editor-text-button" value="2">
            H2
          </button>
          <button type="button" className="ql-header rich-editor-text-button" value="3">
            H3
          </button>
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-bold" aria-label="Bold" />
          <button type="button" className="ql-italic" aria-label="Italic" />
          <button type="button" className="ql-underline" aria-label="Underline" />
          <button type="button" className="ql-blockquote" aria-label="Block quote" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-list" value="ordered" aria-label="Numbered list" />
          <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-link" aria-label="Add link" />
          <button type="button" className="ql-image" aria-label="Add image" />
          <button type="button" className="ql-video" aria-label="Add video" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-clean" aria-label="Clear formatting" />
        </span>
      </div>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: { container: `#${toolbarId}` } }}
        formats={formats}
      />
    </div>
  );
}
