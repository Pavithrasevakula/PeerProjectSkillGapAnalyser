import { useState, useRef, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth.jsx';

export default function VideoIntro() {
  const { user, account } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(account?.videoIntroUrl || null);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setVideoUrl(account?.videoIntroUrl || null);
  }, [account?.videoIntroUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Video size must be less than 50MB');
      return;
    }

    uploadVideo(file);
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const storage = getStorage();
      const fileName = `intro_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `video-intros/${user.uid}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(prog));
        },
        (err) => {
          setError('Upload failed: ' + err.message);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setVideoUrl(downloadURL);
          setUploading(false);
          
          await updateDoc(doc(db, 'users', user.uid), {
            videoIntroUrl: downloadURL
          });
        }
      );
    } catch (err) {
      setError('Failed to upload: ' + err.message);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!videoUrl || !user || deleting) return;
    setDeleting(true);
    setError('');
    
    try {
      const storage = getStorage();
      const videoRef = ref(storage, videoUrl);
      await deleteObject(videoRef);
      
      await updateDoc(doc(db, 'users', user.uid), {
        videoIntroUrl: null
      });
      
      setVideoUrl(null);
    } catch (err) {
      setError('Failed to delete video. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">Video Introduction</h3>
          <p className="text-sm text-neutral-500">Help teammates get to know you better</p>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!videoUrl && !uploading && (
        <div className="border-2 border-dashed border-neutral-300 rounded-xl p-12 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary mb-3"
          >
            Choose Video File
          </button>
          <p className="text-xs text-neutral-500">Maximum 50MB • 30 seconds recommended</p>
        </div>
      )}

      {uploading && (
        <div className="text-center py-10 bg-neutral-50 rounded-xl border border-neutral-100">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg className="animate-spin h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-neutral-800 font-semibold mb-3">Uploading your video...</p>
          <div className="max-w-xs mx-auto bg-neutral-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-neutral-600 mt-3 font-medium">{progress}% complete</p>
        </div>
      )}

      {videoUrl && !uploading && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full rounded-lg border border-neutral-200 shadow-sm bg-black"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex-1"
            >
              Replace Video
            </button>
            <button
              disabled={deleting}
              onClick={handleDelete}
              className="btn-danger flex-1"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
