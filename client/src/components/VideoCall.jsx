import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { db } from "../config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const VideoCall = ({ appointmentId, isDoctor, remoteName, onEndCall }) => {
  const { user, userData } = useAuth();
  const { error: showError } = useToast();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("initializing"); // initializing, connecting, connected, ended
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const callDocRef = useRef(null);
  const offerCandidatesRef = useRef(null);
  const answerCandidatesRef = useRef(null);

  // ICE servers configuration for STUN/TURN servers
  const iceServers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
  };

  // Initialize call
  useEffect(() => {
    const init = async () => {
      try {
        // Create Firestore call references
        callDocRef.current = doc(db, "calls", appointmentId);
        offerCandidatesRef.current = collection(
          callDocRef.current,
          "offerCandidates"
        );
        answerCandidatesRef.current = collection(
          callDocRef.current,
          "answerCandidates"
        );

        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create new remote stream for later use
        const remoteStream = new MediaStream();
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }

        // Initialize the connection (different paths for doctor vs patient)
        if (isDoctor) {
          await initializeAsDoctor();
        } else {
          await initializeAsPatient();
        }
      } catch (err) {
        console.error("Error setting up video call:", err);
        showError(
          "Failed to set up video call. Please check your camera and microphone permissions."
        );
        setCallStatus("ended");
      }
    };

    init();

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      // Delete the call document when the component unmounts
      const cleanup = async () => {
        if (callDocRef.current) {
          try {
            await deleteDoc(callDocRef.current);
            console.log("Call document deleted");
          } catch (err) {
            console.error("Error deleting call document:", err);
          }
        }
      };

      cleanup();
    };
  }, [appointmentId, isDoctor]);

  const initializeAsDoctor = async () => {
    // Doctor creates the offer (initiates the call)
    setCallStatus("connecting");

    // Create RTCPeerConnection
    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = peerConnection;

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Listen for remote tracks
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setCallStatus("connected");
    };

    // ICE candidate collection and handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateData = event.candidate.toJSON();
        setDoc(doc(offerCandidatesRef.current), candidateData);
      }
    };

    // Create offer
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    // Store the offer in Firestore
    const offerData = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      creatorName: userData?.name || user.displayName || "Doctor",
    };

    await setDoc(callDocRef.current, offerData);

    // Listen for answer
    onSnapshot(callDocRef.current, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !peerConnection.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription({
          sdp: data.answer.sdp,
          type: data.answer.type,
        });
        peerConnection.setRemoteDescription(answerDescription);
      }
    });

    // Listen for remote ICE candidates
    onSnapshot(answerCandidatesRef.current, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const candidate = new RTCIceCandidate(data);
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  };

  const initializeAsPatient = async () => {
    setCallStatus("connecting");

    // Wait for doctor to create the call document
    const callDoc = await getDoc(callDocRef.current);
    if (!callDoc.exists()) {
      // Poll for call document if it doesn't exist yet
      const checkCallDoc = setInterval(async () => {
        const newCheck = await getDoc(callDocRef.current);
        if (newCheck.exists()) {
          clearInterval(checkCallDoc);
          continueAsPatient(newCheck.data());
        }
      }, 1000);

      // Stop checking after 60 seconds
      setTimeout(() => {
        clearInterval(checkCallDoc);
        if (callStatus === "connecting") {
          setCallStatus("ended");
          showError("Call connection timed out. Please try again later.");
        }
      }, 60000);
    } else {
      continueAsPatient(callDoc.data());
    }
  };

  const continueAsPatient = async (callData) => {
    // Create and configure peer connection
    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = peerConnection;

    // Add local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Listen for remote tracks
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setCallStatus("connected");
    };

    // ICE candidate collection and handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateData = event.candidate.toJSON();
        setDoc(doc(answerCandidatesRef.current), candidateData);
      }
    };

    // Set remote description (the offer)
    const offerDescription = new RTCSessionDescription({
      sdp: callData.sdp,
      type: callData.type,
    });
    await peerConnection.setRemoteDescription(offerDescription);

    // Create answer
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    // Add answer to call document
    const answerData = {
      answer: {
        sdp: answerDescription.sdp,
        type: answerDescription.type,
      },
      answeredAt: new Date().toISOString(),
      answeredBy: user.uid,
      answererName: userData?.name || user.displayName || "Patient",
    };

    await updateDoc(callDocRef.current, answerData);

    // Listen for ICE candidates from doctor
    onSnapshot(offerCandidatesRef.current, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const candidate = new RTCIceCandidate(data);
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = async () => {
    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    setCallStatus("ended");

    // Clean up Firestore
    try {
      await deleteDoc(callDocRef.current);
    } catch (err) {
      console.error("Error cleaning up call:", err);
    }

    // Notify parent component
    if (onEndCall) {
      onEndCall();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Status indicator */}
      <div className="bg-gray-800 text-white py-2 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div
            className={`h-3 w-3 rounded-full mr-2 ${
              callStatus === "connected"
                ? "bg-green-500"
                : callStatus === "connecting"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          ></div>
          <span>
            {callStatus === "initializing"
              ? "Initializing..."
              : callStatus === "connecting"
              ? "Connecting..."
              : callStatus === "connected"
              ? `Connected with ${remoteName}`
              : "Call ended"}
          </span>
        </div>

        {callStatus === "connected" && (
          <div className="text-sm text-gray-300">
            Appointment ID: {appointmentId.substring(0, 8)}...
          </div>
        )}
      </div>

      {/* Video container */}
      <div className="flex-1 relative bg-black">
        {/* Remote video (main view) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        ></video>

        {/* Local video (smaller PiP) */}
        <div className="absolute bottom-4 right-4 w-1/4 h-1/4 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          ></video>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`rounded-full p-3 ${
            isAudioMuted ? "bg-red-500" : "bg-gray-700"
          } text-white`}
          title={isAudioMuted ? "Unmute" : "Mute"}
        >
          {isAudioMuted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`rounded-full p-3 ${
            isVideoOff ? "bg-red-500" : "bg-gray-700"
          } text-white`}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        <button
          onClick={endCall}
          className="rounded-full p-3 bg-red-600 text-white"
          title="End call"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
