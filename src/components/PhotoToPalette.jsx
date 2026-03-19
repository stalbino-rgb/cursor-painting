import React, { useRef, useCallback } from 'react';
import { ImagePlus, MousePointer2 } from 'lucide-react';
import { rgbToHex } from '../utils/mixing';

function PhotoToPalette({ onColorPick }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imageSrc, setImageSrc] = React.useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleImageClick = useCallback(
    (e) => {
      if (!imageSrc || !imgRef.current) return;
      const img = imgRef.current;
      const rect = img.getBoundingClientRect();
      const scaleX = img.naturalWidth / rect.width;
      const scaleY = img.naturalHeight / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex([data[0] / 255, data[1] / 255, data[2] / 255]);
      onColorPick?.(hex);
    },
    [imageSrc, onColorPick]
  );

  const clearImage = () => {
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  React.useEffect(() => () => imageSrc && URL.revokeObjectURL(imageSrc), [imageSrc]);

  return (
    <div className="rounded-3xl bg-slate-50/80 border border-slate-100/80 p-4 md:p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-300 via-fuchsia-300 to-pink-300 flex items-center justify-center shadow-sm">
            <ImagePlus size={18} className="text-white drop-shadow-sm" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Photo to Palette
            </p>
            <p className="text-[11px] text-slate-500">
              사진을 업로드하고 클릭해 색상을 추출해 보세요.
            </p>
          </div>
        </div>
      </div>

      {!imageSrc ? (
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer p-6 transition-colors paint-swatch">
          <ImagePlus size={32} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600">사진 업로드</span>
          <span className="text-[11px] text-slate-400">JPG, PNG 등 이미지 파일</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="이미지 업로드"
          />
        </label>
      ) : (
        <div className="space-y-2">
          <div className="group relative rounded-2xl overflow-hidden paint-swatch shadow-inner max-h-40">
            <img
              ref={imgRef}
              src={imageSrc}
              alt="업로드된 사진"
              className="w-full h-auto max-h-40 object-contain cursor-crosshair"
              onClick={handleImageClick}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/15">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-lg">
                <MousePointer2 size={14} />
                클릭하여 색상 추출
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>이미지를 클릭하면 해당 픽셀 색상이 목표 색으로 설정됩니다.</span>
            <button
              type="button"
              onClick={clearImage}
              className="text-slate-400 hover:text-slate-600 underline"
            >
              이미지 제거
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default PhotoToPalette;
