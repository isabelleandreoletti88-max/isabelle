import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { uploadImage } from '@/lib/adminService';

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: 'site-images' | 'product-images';
  folder?: string;
  label?: string;
  shape?: 'square' | 'wide';
  /** Nom donné au fichier (référencement), par exemple le nom de la matière. */
  baseName?: string;
};

export default function ImageUploader({ value, onChange, bucket = 'site-images', folder = 'library', label = 'Image', shape = 'square', baseName = '' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function chooseFile(file: File) {
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadImage(file, bucket, folder, baseName);
      onChange(uploaded.url);
    } catch {
      setError('L\u2019image n\u2019a pas pu \u00eatre import\u00e9e.');
    } finally {
      setUploading(false);
    }
  }

  const previewClass = shape === 'wide' ? 'w-full aspect-[4/3]' : 'w-28 h-28';

  return (
    <div>
      <span className="label-field">{label}</span>
      <div className="flex gap-4 items-start mt-1">
        <div className={`${previewClass} rounded-soft overflow-hidden bg-beige/20 shrink-0 border border-wood-deep/10 relative`}>
          {value ? (
            <>
              <img src={value} alt="Aper\u00e7u" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute -top-2 -right-2 bg-red-700 text-off-white rounded-full p-1.5 hover:bg-red-800 transition-colors"
                aria-label="Supprimer l\u2019image"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImagePlus className="h-8 w-8 text-wood-deep/30" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className={`btn-secondary cursor-pointer inline-flex items-center gap-2 w-fit ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'Import en cours\u2026' : 'Parcourir\u2026'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void chooseFile(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
          <p className="mt-2 text-xs text-wood-deep/50">JPG, PNG ou WebP \u2014 8 Mo maximum.</p>
        </div>
      </div>
    </div>
  );
}
