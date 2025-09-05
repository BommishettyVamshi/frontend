import { useState, useRef, useEffect } from "react";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { FaStopwatch, FaDownload, FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { GrFormView } from "react-icons/gr";
import "./App.css";

const App = () => {
  const [isRecording, setIsRecording] = useState(false); // recording state
  const [videoRecordedURL, setVideoRecordedURL] = useState(null); // recorded video URL
  const [isPreparing, setIsPreparing] = useState(false); // preparing to record state
  const [recordingTime, setRecordingTime] = useState(0); // recording timer
  const [recordings, setRecordings] = useState([]); // uploaded recordings
  const mediaRecorderRef = useRef(null); // MediaRecorder instance
  const recordedChunksRef = useRef([]); // recorded video chunks
  const timerRef = useRef(null); // timer interval to stop tracks on stop recording
  const screenStreamRef = useRef(null); // screen stream
  const micStreamRef = useRef(null); // mic stream

  // Fetch recordings from backend
  const fetchRecordings = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL; // Backend URL from environment variable
      const res = await fetch(`${baseUrl}/api/recordings`);
      const data = await res.json();
      setRecordings(data);
      console.log("Fetched recordings:", data);
    } catch (err) {
      console.error("Error fetching recordings:", err);
    }
  };

  // Fetch recordings on component mount
  useEffect(() => {
    fetchRecordings();
  }, []);

  // Start recording
  const startRecording = async () => {
    setVideoRecordedURL(null); // Clear previous recording
    setIsPreparing(true); // Show preparing state
    setRecordingTime(0); // Reset timer
    try {
      // Request screen and mic access
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Handle case where screen sharing is stopped by user
      screenStreamRef.current = screenStream;

      // Request microphone access
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Handle case where mic access is denied
      micStreamRef.current = micStream;

      // Combine screen and mic streams
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...screenStream.getAudioTracks(),
        ...micStream.getAudioTracks(),
      ]);

      // Setup MediaRecorder with combined stream
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9",
      });

      // Clear previous recordings
      recordedChunksRef.current = [];

      // Handle dataavailable event to collect recorded chunks
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Handle stop event to create video URL
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setVideoRecordedURL(url); // Set recorded video URL for preview/download
        setIsRecording(false); // Update recording state
        setIsPreparing(false); // Clear preparing state
        setRecordingTime(0); // Reset timer
        clearInterval(timerRef.current); // Clear timer interval
      };

      // Stop recording if screen sharing is stopped
      screenStream.getTracks().forEach((track) => {
        track.onended = () => {
          // Stop recording if still recording
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop(); // This will trigger onstop event
            setIsRecording(false); // Update recording state
          }
        };
      });

      mediaRecorderRef.current.start(); // Start recording
      setIsPreparing(false); // Clear preparing state
      setIsRecording(true); // Update recording state

      // Start timer to track recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime + 1 >= 180) {
            // 3 minutes limit
            alert("Maximum recording time of 3 minutes reached.");
            stopRecording();
            return 180;
          }
          return prevTime + 1;
        });
      }, 1000); // Increment every second
    } catch (err) {
      console.error("Error: " + err);
      alert("Failed to start recording. Please allow screen and mic access."); // Notify user of error
      setIsPreparing(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    // Stop MediaRecorder and streams
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop()); // Stop all tracks
      screenStreamRef.current = null; // Clear reference
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop()); // Stop all tracks
      micStreamRef.current = null; // Clear reference
    }
    setIsRecording(false);
    setIsPreparing(false);
    clearInterval(timerRef.current);
  };

  // Download recording
  const downloadRecording = () => {
    if (!videoRecordedURL) return;
    const a = document.createElement("a"); // Create a temporary anchor element
    a.href = videoRecordedURL; // Set href to recorded video URL
    a.download = "recording.webm"; // Set download attribute with filename
    document.body.appendChild(a); // Append anchor to body
    a.click(); // Trigger download
    document.body.removeChild(a); // Clean up by removing anchor
  };

  // Upload recording to backend
  const uploadRecording = async () => {
    if (!videoRecordedURL) return; // No recording to upload

    try {
      const response = await fetch(videoRecordedURL); // Fetch the recorded video blob
      const blob = await response.blob(); // Convert response to blob

      // Prepare form data for upload

      const formData = new FormData();
      formData.append("recording", blob, "recording.webm");
      console.log("formData:", formData.get("recording"));

      // Send POST request to backend
      const baseUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${baseUrl}/api/recordings`, {
        method: "POST",
        body: formData,
      });

      // Handle response
      if (!res.ok) {
        throw new Error("Upload failed with status " + res.status);
      }

      // Log success and refresh recordings list
      const data = await res.json();
      console.log("Uploaded:", data);

      fetchRecordings();
      alert("Recording uploaded successfully!"); // Notify user of success
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload recording."); // Notify user of error
    }
  };

  // Delete recording
  const deleteRecording = async (recordId) => {
    // Confirm deletion
    if (window.confirm("Are you sure you want to delete this recording?")) {
      try {
        // Send DELETE request to backend
        const baseUrl = import.meta.env.VITE_API_URL;
        const res = await fetch(`${baseUrl}/api/recordings/${recordId}`, {
          method: "DELETE",
        });
        const data = await res.json(); // Parse JSON response

        // Handle non-OK response
        if (!res.ok) {
          throw new Error(data.message || "Delete failed");
        }

        // Log success and refresh recordings list
        console.log("Deleted:", data);
        fetchRecordings(); // Refresh recordings list
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  // Format time in mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0"); // minutes with leading zero
    const secs = (seconds % 60).toString().padStart(2, "0"); // seconds with leading zero
    return `${mins}:${secs}`;
  };

  // JSX rendering
  return (
    <div className='screen-recorder-app-container'>
      <h1 className='app-heading'>MERN Screen Recorder App</h1>
      <div className='button-container-bg'>
        <div className='button-container'>
          <div className='button-card'>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`
                ${
                  !isRecording
                    ? "start-recording-button"
                    : "stop-recording-button"
                }
                ${isPreparing ? "scale-record-button" : ""}
                ${isRecording ? "scale-stop-button" : ""}
              `}
            />
          </div>
          <p className='instruction-text'>
            {isPreparing
              ? "Preparing to record..."
              : !isRecording
              ? "Click to start recording"
              : "Recording... Click to stop"}
          </p>
          <div className='recording-timer'>
            {isRecording && (
              <FaStopwatch style={{ marginRight: "8px", color: "#fa0a2a" }} />
            )}
            <p className='time'>{isRecording && formatTime(recordingTime)}</p>
          </div>

          {/* Popup for preview, download, upload */}
          {videoRecordedURL && (
            <Popup
              trigger={
                <div className='preview-container'>
                  <button className='preview-button'>
                    <GrFormView
                      style={{
                        fontSize: "30px",
                        color: "#ffffff",
                      }}
                    />
                  </button>
                </div>
              }
              modal
              nested
              contentStyle={{
                width: "80%",
                height: "80%",
                padding: "1rem",
                border: "none",
                boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
                borderRadius: "8px",
                backgroundColor: "transparent",
              }}>
              {(close) => (
                <div className='popup-container'>
                  <div className='popup-action-container'>
                    <div className='actions-card'>
                      <button
                        className='download-button'
                        onClick={() => {
                          downloadRecording();
                          setVideoRecordedURL(null);
                        }}
                        aria-label='Download recording'>
                        <FaDownload
                          style={{
                            fontSize: "20px",
                            marginRight: "8px",
                            color: "#ffffff",
                          }}
                        />
                      </button>
                      <button
                        className='upload-button'
                        onClick={() => {
                          uploadRecording();
                          setVideoRecordedURL(null);
                        }}
                        aria-label='Upload recording'>
                        <FaCloudUploadAlt
                          style={{
                            fontSize: "25px",
                            marginLeft: "8px",
                            color: "#ffffff",
                          }}
                        />
                      </button>
                    </div>
                    <button
                      className='close-button'
                      onClick={() => {
                        close();
                      }}>
                      &times;
                    </button>
                  </div>
                  <div className='video-preview-container'>
                    <video
                      src={videoRecordedURL}
                      controls
                      className='video-preview'
                    />
                  </div>
                </div>
              )}
            </Popup>
          )}
        </div>
      </div>
      <h2 className='heading-2'>Uploaded Recordings</h2>

      {/*Uploaded recordings list */}
      <div className='recordings-list'>
        {recordings.length === 0 ? (
          <p className='no-recordings-text'>No recordings found</p>
        ) : (
          <ul className='recordings-ul'>
            {recordings.map((rec) => (
              <li key={rec.id} className='recording-item'>
                <video src={rec.url} controls className='video-player' />
                <div className='recording-info'>
                  <p className='recording-filename'>
                    {rec.filename} — {Math.round(rec.filesize / 1024)} KB
                  </p>
                  <button
                    className='delete-button'
                    onClick={() => {
                      deleteRecording(rec.id);
                    }}
                    aria-label='Delete recording'>
                    <MdDelete
                      style={{
                        fontSize: "20px",
                        color: "#ffffff",
                      }}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
