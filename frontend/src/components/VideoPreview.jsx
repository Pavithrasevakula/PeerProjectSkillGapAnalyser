export default function VideoPreview({ videoUrl, userName, onClose }) {
  if (!videoUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="video-preview-title" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 id="video-preview-title" className="text-lg font-semibold text-neutral-800">Video Introduction</h3>
              <p className="text-sm text-neutral-500">{userName}</p>
            </div>
          </div>
          <button
            aria-label="Close video preview"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>
        </div>
        
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full rounded-lg border border-neutral-200 shadow-sm bg-black"
        />

        <button onClick={onClose} className="btn-secondary w-full mt-5">
          Close Preview
        </button>
      </div>
    </div>
  );
}
