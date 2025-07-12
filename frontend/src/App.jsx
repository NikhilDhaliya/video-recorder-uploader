import { useRef, useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const videoId = useRef(Date.now().toString());

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        setRecordedChunks(prev => [...prev, e.data]);

        // Upload chunk to backend
        const formData = new FormData();
        formData.append('chunk', e.data);
        formData.append('chunkId', Date.now().toString());
        formData.append('videoId', videoId.current);

        try {
          await axios.post('http://localhost:4000/upload-chunk', formData);
          console.log('Chunk uploaded');
        } catch (err) {
          console.error('Chunk upload failed:', err);
        }
      }
    };

    recorder.start(5000);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    const tracks = videoRef.current.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    setRecording(false);
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
  };

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h1>📹 Live Video Uploader + Local Save</h1>
      <video ref={videoRef} autoPlay playsInline width={640} height={480} />
      <div style={{ marginTop: 20 }}>
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
        {!recording && recordedChunks.length > 0 && (
          <button onClick={downloadRecording} style={{ marginLeft: '1rem' }}>
            Download Recording
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
