import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Loader2, X } from 'lucide-react';
import { Button } from '../ui/Primitives';

const ACCEPT = ['.pdf', '.docx'];

export default function UploadDropzone({ onUpload, uploading }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    const ok = ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (ok) setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!file) return;
    await onUpload(file);
    setFile(null);
  };

  return (
    <div>
      <motion.div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        whileHover={{ scale: 1.005 }}
      >
        <motion.div className="dz-icon" animate={{ y: drag ? -4 : 0 }}>
          <UploadCloud size={26} />
        </motion.div>
        <div className="dz-title">Drop your resume here, or click to browse</div>
        <div className="dz-hint">PDF or DOCX · up to 5 MB</div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </motion.div>

      {file && (
        <motion.div
          className="row spread"
          style={{ marginTop: 14 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="dz-file">
            <FileText size={15} />
            {file.name}
            <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => setFile(null)}>
              <X size={12} />
            </button>
          </span>
          <Button onClick={submit} disabled={uploading}>
            {uploading ? <Loader2 className="spinner" size={16} /> : <UploadCloud size={16} />}
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
