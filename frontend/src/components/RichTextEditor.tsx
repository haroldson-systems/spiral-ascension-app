import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image', 'video'],
  ['clean'],
];

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
  return (
    <div className="rich-editor overflow-hidden rounded-xl border border-purple-700/50 bg-purple-900/40">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: toolbarOptions }}
        formats={formats}
      />
    </div>
  );
}
