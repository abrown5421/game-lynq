import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import GradientPicker from 'react-best-gradient-color-picker';
import { PencilIcon } from '@heroicons/react/24/outline';

interface GradientBannerProps {
  gradient: string;
  onSave?: (newGradient: string) => void;
  editable?: boolean;
  height?: number;
  className?: string;
}

const GradientBanner = ({
  gradient: initialGradient,
  onSave,
  editable = false,
  height = 220,
  className = "",
}: GradientBannerProps) => {
  const [gradient, setGradient] = useState(initialGradient);
  const [savedGradient, setSavedGradient] = useState(initialGradient);
  const [editorOpen, setEditorOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setGradient(savedGradient);
        setEditorOpen(false);
      }
    };

    if (editorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editorOpen, savedGradient]);

  const handleSave = () => {
    setSavedGradient(gradient);
    setEditorOpen(false);
    if (onSave) onSave(gradient);
  };

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <div className="w-full h-full" style={{ background: gradient }} />

      {editable && (
        <div className="absolute top-3 right-3 z-20 shadow-2xl">
          <AnimatePresence mode="wait">
            {!editorOpen && (
              <motion.button
                key="edit-button"
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setEditorOpen(true)}
                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
              >
                <PencilIcon className="h-5 w-5" />
              </motion.button>
            )}

            {editorOpen && (
              <motion.div
                key="editor"
                ref={editorRef}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-neutral-900 rounded-xl shadow-xl p-3 w-[320px]"
              >
                <GradientPicker value={gradient} onChange={setGradient} />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => {
                      setGradient(savedGradient);
                      setEditorOpen(false);
                    }}
                    className="btn-gray"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GradientBanner;
