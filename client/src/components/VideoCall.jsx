import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { io } from "socket.io-client";

const VideoCall = ({ appointmentId, isDoctor, remoteName, onEndCall }) => {
  const { user, userData } = useAuth();
  const { error: showError, success } = useToast();

  const [localStream, setLocalStream] = useState(null);
  const [callStatus, setCallStatus] = useState("initializing"); // initializing, connecting, connected, ended
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Enhanced ICE server configuration
  const iceServers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
      // Free TURN server (for demo only - in production use your own)
      {
        urls: "turn:numb.viagenie.ca",
        username: "webrtc@live.com",
        credential: "muazkh",
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // Add this helper function before the useEffect
  const getMediaWithDeviceSelection = async () => {
    try {
      // First try to enumerate all available devices
      console.log("Enumerating media devices...");
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Filter for video input devices
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      console.log(
        `Found ${videoDevices.length} video devices and ${audioDevices.length} audio devices`
      );

      // If we have video devices, try them one by one
      if (videoDevices.length > 0) {
        // Try each video device until one works
        for (const videoDevice of videoDevices) {
          console.log(
            `Attempting to use video device: ${
              videoDevice.label || videoDevice.deviceId
            }`
          );

          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: videoDevice.deviceId },
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 15 },
              },
              audio: true,
            });

            console.log(
              `Successfully accessed device: ${
                videoDevice.label || videoDevice.deviceId
              }`
            );
            return stream;
          } catch (err) {
            console.warn(
              `Failed to access video device ${
                videoDevice.label || videoDevice.deviceId
              }:`,
              err
            );
            // Continue to the next device
          }
        }
      }

      // If we reach here, none of the video devices worked, try audio only
      console.log("All video devices failed, trying audio only");
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
    } catch (err) {
      console.error("Device selection failed:", err);
      throw err;
    }
  };

  // Initialize WebRTC and establish connection
  useEffect(() => {
    // Check if we're in a secure context - required for camera access in many browsers
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      console.error("Video calls require a secure (HTTPS) connection");
      showError(
        "Video calls require a secure (HTTPS) connection. Please use HTTPS to access this site."
      );
      setMediaError("Insecure connection - camera access requires HTTPS");
      setCallStatus("ended");
      return;
    }

    // Check browser support for getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported in this browser");
      showError(
        "Your browser doesn't support video calls. Please try a modern browser like Chrome, Firefox, or Edge."
      );
      setMediaError("getUserMedia not supported");
      setCallStatus("ended");
      return;
    }

    // Initialize socket connection
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    console.log("Initializing WebRTC connection");

    // Connect to socket and set up event handlers
    socket.on("connect", async () => {
      console.log("Socket connected, ID:", socket.id);

      try {
        // Initialize media with specific constraints and fallbacks
        let stream = null;
        let errorMessage = null;

        // First attempt with standard constraints
        try {
          console.log("Attempting to get media with default constraints");
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24 },
            },
            audio: true,
          });

          console.log("Media stream obtained:", stream);
          console.log("Video tracks:", stream.getVideoTracks().length);
          console.log("Audio tracks:", stream.getAudioTracks().length);

          // Log track details
          stream.getTracks().forEach((track) => {
            console.log(
              `Track ${track.id}: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}`
            );
          });
        } catch (err) {
          console.error("Default media access failed:", err);

          if (
            err.name === "NotReadableError" ||
            err.name === "NotAllowedError" ||
            err.name === "AbortError"
          ) {
            console.log("Camera access error, trying device-specific approach");
            stream = await getMediaWithDeviceSelection();

            // Check if we got video
            if (stream.getVideoTracks().length === 0) {
              errorMessage = "Camera access failed. Using audio-only mode.";
              setIsVideoOff(true);
            }
          } else {
            throw err;
          }
        }

        if (errorMessage) {
          showError(errorMessage);
        }

        // Check what we actually got
        console.log("Media access successful");
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        console.log(
          `Got ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks`
        );

        if (videoTracks.length > 0) {
          const videoTrack = videoTracks[0];
          console.log("Using video device:", videoTrack.label);
          console.log("Video track settings:", videoTrack.getSettings());
          console.log("Video track constraints:", videoTrack.getConstraints());
        }

        if (audioTracks.length > 0) {
          console.log("Using audio device:", audioTracks[0].label);
          console.log("Audio track settings:", audioTracks[0].getSettings());
          console.log(
            "Audio track constraints:",
            audioTracks[0].getConstraints()
          );
        }

        setLocalStream(stream);

        // Set up local video display
        if (localVideoRef.current) {
          console.log("Setting local video");
          localVideoRef.current.srcObject = stream;

          localVideoRef.current.onloadedmetadata = () => {
            console.log("Local video metadata loaded");
            localVideoRef.current
              .play()
              .then(() => console.log("Local video playing"))
              .catch((err) => console.error("Error playing local video:", err));
          };
        }

        // Join room
        const userId = userData?._id || user?.uid || socket.id;
        const userName = userData?.name || user?.displayName || "User";

        console.log(`Joining room ${appointmentId} as ${userName}`);
        socket.emit("join_video_room", {
          appointmentId,
          userId,
          name: userName,
          isDoctor,
        });

        setCallStatus("connecting");
      } catch (err) {
        console.error("Media initialization failed:", err);
        setMediaError(err.message);
        setCallStatus("ended");
        showError(`Media access failed: ${err.message}`);
      }
    });

    // Socket event handlers
    socket.on("room_joined", ({ users }) => {
      console.log("Room joined, users:", users);

      // If more than one user is present, initialize the peer connection
      if (users.length > 1) {
        console.log("Multiple users in room, creating peer connection");
        createPeerConnection();

        // If we're the doctor, initiate the call
        if (isDoctor) {
          setTimeout(() => {
            if (
              peerConnectionRef.current &&
              peerConnectionRef.current.connectionState !== "connected"
            ) {
              console.log("Doctor initiating call after join");
              createOffer();
            }
          }, 1000);
        }
      }
    });

    // Add handler for signaling errors
    socket.on("signaling_error", ({ message, type }) => {
      console.error(`Signaling error (${type}): ${message}`);
      showError(`Connection error: ${message}. Please try again.`);

      // If it's a critical error, try to reconnect
      if (type === "room_error" || type === "server_error") {
        setTimeout(() => {
          attemptReconnection();
        }, 2000);
      }
    });

    socket.on("user_joined", ({ userId, name }) => {
      console.log(`User joined: ${name} (${userId})`);
      success(`${name} joined the call`);

      // Create peer connection when another user joins
      createPeerConnection();

      // If we're the doctor, initiate the call
      if (isDoctor) {
        setTimeout(() => {
          console.log("Doctor initiating call after user joined");
          createOffer();
        }, 1000);
      }
    });

    socket.on("user_left", ({ userId, name }) => {
      console.log(`User left: ${name} (${userId})`);
      showError(`${name} has left the call`);
      setCallStatus("ended");
    });

    socket.on("offer", async ({ offer }) => {
      console.log("Received offer");
      await handleOffer(offer);
    });

    socket.on("answer", async ({ answer }) => {
      console.log("Received answer");
      await handleAnswer(answer);
    });

    socket.on("ice_candidate", async ({ candidate }) => {
      console.log("Received ICE candidate");
      await handleNewICECandidate(candidate);
    });

    socket.on("call_ended", () => {
      console.log("Remote peer ended the call");
      showError(`${remoteName} ended the call`);
      setCallStatus("ended");
      if (onEndCall) onEndCall();
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      showError(`Connection error: ${err.message}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server intentionally disconnected, try to reconnect
        socket.connect();
      }
    });

    // Cleanup
    return () => {
      console.log("Cleaning up VideoCall component");
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [appointmentId, isDoctor, remoteName, API_URL, user, userData]);

  // Create offer (for initiator)
  const createOffer = async () => {
    try {
      if (!peerConnectionRef.current) {
        console.log("Creating peer connection before creating offer");
        await createPeerConnection();
      }

      console.log("Creating offer with proper constraints");
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: true,
      };

      // Ensure we have a clean slate for negotiation
      if (peerConnectionRef.current.signalingState !== "stable") {
        console.log("Signaling state not stable, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log("Creating offer");
      const offer = await peerConnectionRef.current.createOffer(offerOptions);
      console.log("Created offer SDP:", offer.sdp);

      console.log("Setting local description");
      await peerConnectionRef.current.setLocalDescription(offer);

      // Wait for ICE gathering to complete or timeout after 2 seconds
      await new Promise((resolve) => {
        const checkState = () => {
          if (
            peerConnectionRef.current.iceGatheringState === "complete" ||
            peerConnectionRef.current.iceConnectionState === "connected"
          ) {
            resolve();
          } else {
            setTimeout(checkState, 500);
          }
        };

        // Start checking state
        checkState();

        // Set a timeout in case ICE gathering never completes
        setTimeout(resolve, 2000);
      });

      console.log("Sending offer to remote peer with full SDP");
      socketRef.current.emit("offer", {
        appointmentId,
        offer: peerConnectionRef.current.localDescription || offer,
      });
    } catch (error) {
      console.error("Error creating offer:", error);
      showError("Failed to initiate call");
    }
  };

  // Create peer connection and send offer (for initiator)
  const createPeerConnection = async () => {
    try {
      console.log("Creating peer connection");

      // Close any existing peer connection
      if (peerConnectionRef.current) {
        console.log("Closing existing peer connection");
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Create new RTCPeerConnection with explicit configuration
      const config = {
        ...iceServers,
        sdpSemantics: "unified-plan",
      };

      console.log("Using RTCPeerConnection config:", config);
      const peerConnection = new RTCPeerConnection(config);
      peerConnectionRef.current = peerConnection;

      // Add all media tracks from local stream to peer connection
      if (localStream) {
        const tracks = localStream.getTracks();
        console.log(`Adding ${tracks.length} local tracks to peer connection`);

        for (const track of tracks) {
          try {
            console.log(
              `Adding ${track.kind} track to peer connection:`,
              track.id
            );
            peerConnection.addTrack(track, localStream);
          } catch (err) {
            console.error(`Error adding ${track.kind} track:`, err);
          }
        }
      } else {
        console.warn("No local stream available to add tracks");

        // Try to get media again if we don't have it
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          setLocalStream(stream);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Add tracks from newly acquired stream
          stream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, stream);
            console.log(`Added ${track.kind} track after retry`);
          });
        } catch (err) {
          console.error("Failed to get media in retry:", err);
        }
      }

      // Handle incoming tracks from remote peer
      peerConnection.ontrack = (event) => {
        console.log(
          `Received remote ${event.track.kind} track:`,
          event.track.id
        );

        // Always create a new MediaStream for consistency
        let stream;

        if (event.streams && event.streams.length > 0) {
          stream = event.streams[0];
          console.log(
            `Using provided stream with ${stream.getTracks().length} tracks`
          );
        } else {
          // If no stream was provided, create one
          stream = new MediaStream();
          stream.addTrack(event.track);
          console.log(
            `Created new stream with single ${event.track.kind} track`
          );
        }

        // Set the remote video stream and play it
        if (remoteVideoRef.current) {
          console.log(`Setting remote ${event.track.kind} to video element`);

          // For video tracks, we set the entire stream
          if (event.track.kind === "video") {
            remoteVideoRef.current.srcObject = stream;

            remoteVideoRef.current.onloadedmetadata = () => {
              console.log("Remote video metadata loaded");
              remoteVideoRef.current
                .play()
                .then(() => {
                  console.log("Remote video playing successfully");
                  setCallStatus("connected");
                })
                .catch((err) => {
                  console.error("Error playing remote video:", err);
                  showPlayButton();
                });
            };
          }
          // For audio tracks, we just check if we need to add them to existing stream
          else if (event.track.kind === "audio") {
            if (remoteVideoRef.current.srcObject) {
              // If we already have a stream, check if it has an audio track
              const existingStream = remoteVideoRef.current.srcObject;
              if (existingStream.getAudioTracks().length === 0) {
                existingStream.addTrack(event.track);
                console.log("Added audio track to existing stream");
              }
            } else {
              // If no stream yet, create one with just the audio track
              remoteVideoRef.current.srcObject = stream;
              console.log("Set audio-only stream to video element");
            }
          }
        }
      };

      // Create a function to show a play button for autoplay restrictions
      const showPlayButton = () => {
        // Create a play button overlay for autoplay restrictions
        showError("Click to start the remote video");

        // Add a UI element to manually play the video
        const playButton = document.createElement("button");
        playButton.innerText = "Click to Show Remote Video";
        playButton.style.position = "absolute";
        playButton.style.top = "50%";
        playButton.style.left = "50%";
        playButton.style.transform = "translate(-50%, -50%)";
        playButton.style.padding = "12px 20px";
        playButton.style.background = "#3B82F6";
        playButton.style.color = "white";
        playButton.style.border = "none";
        playButton.style.borderRadius = "4px";
        playButton.style.cursor = "pointer";
        playButton.style.zIndex = "100";

        playButton.onclick = () => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current
              .play()
              .then(() => {
                console.log("Remote video playing after user interaction");
                playButton.remove();
              })
              .catch((e) =>
                console.error("Play failed even after user interaction:", e)
              );
          }
        };

        // Add the button to the video container
        if (remoteVideoRef.current && remoteVideoRef.current.parentNode) {
          remoteVideoRef.current.parentNode.appendChild(playButton);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Generated ICE candidate:", event.candidate.candidate);
          socketRef.current.emit("ice_candidate", {
            appointmentId,
            candidate: event.candidate,
          });
        } else {
          console.log("ICE candidate gathering complete");
        }
      };

      // Connection state monitoring
      peerConnection.onconnectionstatechange = () => {
        console.log(
          "Connection state changed:",
          peerConnection.connectionState
        );

        if (peerConnection.connectionState === "connected") {
          console.log("Peer connection established successfully");
          setCallStatus("connected");
          success("Connected to call");
        } else if (peerConnection.connectionState === "disconnected") {
          console.log("Connection disconnected, attempting to reconnect...");
          showError("Connection interrupted. Attempting to reconnect...");
        } else if (peerConnection.connectionState === "failed") {
          console.log("Connection failed");
          showError("Connection failed. Please try rejoining the call.");
          attemptReconnection();
        } else if (peerConnection.connectionState === "closed") {
          console.log("Connection closed");
          setCallStatus("ended");
        }
      };

      // ICE connection state monitoring
      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);

        if (peerConnection.iceConnectionState === "failed") {
          console.log("ICE connection failed, attempting reconnection");
          attemptReconnection();
        }
      };

      // Log negotiation needed events
      peerConnection.onnegotiationneeded = (event) => {
        console.log("Negotiation needed event fired");
        if (isDoctor) {
          setTimeout(() => createOffer(), 500);
        }
      };

      return peerConnection;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      showError("Failed to establish call connection");
      setCallStatus("ended");
    }
  };

  // Handle incoming offer (for non-initiator)
  const handleOffer = async (offer) => {
    try {
      console.log("Handling incoming offer");

      if (!peerConnectionRef.current) {
        console.log("Creating peer connection to handle offer");
        await createPeerConnection();
      }

      const peerConnection = peerConnectionRef.current;

      // Log the received offer SDP for debugging
      console.log("Received offer SDP:", offer.sdp);

      // Create a properly formatted RTCSessionDescription from the offer
      const rtcOffer = new RTCSessionDescription(offer);

      // If we're already setting a remote description, wait for it
      if (peerConnection.signalingState !== "stable") {
        console.log(
          "Signaling state not stable, waiting before setting remote description"
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log("Setting remote description (offer)");
      await peerConnection.setRemoteDescription(rtcOffer);

      console.log("Creating answer");
      const answer = await peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      // Log the created answer SDP for debugging
      console.log("Created answer SDP:", answer.sdp);

      console.log("Setting local description (answer)");
      await peerConnection.setLocalDescription(answer);

      // Wait a moment to let ICE candidates gather
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Sending answer");
      socketRef.current.emit("answer", {
        appointmentId,
        answer: peerConnection.localDescription || answer,
      });
    } catch (error) {
      console.error("Error handling offer:", error);
      showError("Failed to accept call");

      // Try to recover by restarting the connection
      setTimeout(() => attemptReconnection(), 2000);
    }
  };

  // Handle incoming answer (for initiator)
  const handleAnswer = async (answer) => {
    try {
      if (peerConnectionRef.current) {
        // Log the received answer SDP for debugging
        console.log("Received answer SDP:", answer.sdp);

        console.log("Setting remote description (answer)");
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        console.log("Connection setup complete");
      }
    } catch (error) {
      console.error("Error handling answer:", error);
      showError("Failed to establish connection");
    }
  };

  // Handle incoming ICE candidate
  const handleNewICECandidate = async (candidate) => {
    try {
      if (peerConnectionRef.current) {
        console.log("Adding ICE candidate");
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // End call
  const endCall = () => {
    console.log("Ending call");

    // Stop tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Notify server
    if (socketRef.current) {
      socketRef.current.emit("end_call", { appointmentId });
    }

    setCallStatus("ended");

    // Notify parent component
    if (onEndCall) {
      onEndCall();
    }
  };

  // Add a reconnection function after the createPeerConnection function
  const attemptReconnection = () => {
    console.log("Attempting to reconnect WebRTC connection");

    // Close existing peer connection if any
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      } catch (err) {
        console.error("Error closing peer connection:", err);
      }
    }

    // Check if we still have local media, if not try to reacquire it
    if (
      !localStream ||
      localStream.getTracks().length === 0 ||
      localStream.getTracks().some((track) => !track.enabled)
    ) {
      console.log("Local media missing or disabled, trying to reacquire");
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
          // Stop any existing local streams
          if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
          }

          // Set the new stream
          setLocalStream(stream);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          console.log("Successfully reacquired local media");
        })
        .catch((err) => {
          console.error("Failed to reacquire media:", err);
          showError(
            "Couldn't access camera/microphone. Please check permissions."
          );
        });
    }

    // Try to create a new peer connection after a short delay
    setTimeout(() => {
      try {
        if (callStatus !== "ended") {
          setCallStatus("connecting");
          createPeerConnection().then(() => {
            if (isDoctor) {
              console.log("Doctor initiating call after reconnection");
              createOffer();
            }
          });
          success("Reconnecting to call...");
        }
      } catch (err) {
        console.error("Reconnection attempt failed:", err);
        showError("Reconnection failed. Please reload the page.");
      }
    }, 2000);
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

      {/* Media error message */}
      {mediaError && callStatus !== "ended" && (
        <div className="bg-red-700 text-white p-2 text-center">
          <p>{mediaError}</p>
        </div>
      )}

      {/* Video container */}
      <div className="flex-1 relative bg-black">
        {/* Remote video (main view) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{
            background: "#000",
            maxHeight: "100%",
            maxWidth: "100%",
          }}
          muted={false}
        ></video>

        {/* Local video (smaller PiP) */}
        <div className="absolute bottom-4 right-4 w-1/4 h-1/4 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ background: "#333" }}
          ></video>
        </div>

        {/* Connection status overlay */}
        {callStatus === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300 mx-auto mb-4"></div>
              <p className="text-lg">Connecting to {remoteName}...</p>
              <p className="text-sm mt-2">
                Please wait while we establish the connection.
              </p>
              <p className="text-sm mt-1 text-yellow-300">
                Make sure your camera and microphone are enabled.
              </p>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={attemptReconnection}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Retry Connection
                </button>
                <button
                  onClick={() => {
                    navigator.mediaDevices
                      .getUserMedia({ audio: true, video: true })
                      .then((stream) => {
                        showError(
                          "Please accept camera/microphone permissions"
                        );
                        stream.getTracks().forEach((track) => track.stop());
                      })
                      .catch((err) =>
                        showError(
                          "Please check your camera/microphone settings"
                        )
                      );
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Check Permissions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Call is ended message */}
        {callStatus === "ended" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <h3 className="text-xl font-semibold mb-4">Call Ended</h3>
              <button
                onClick={onEndCall}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {callStatus !== "ended" && (
        <div className="bg-gray-800 text-white py-3 px-4 flex justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              isAudioMuted ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isAudioMuted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.586 15H4a1 1 0 110-2h1.586l4.707-4.707C10.923 8.663 12 8.149 12 7a1 1 0 012 0c0 1.149 1.077 1.663 1.707 1.293L19.414 5H21a1 1 0 110 2h-1.586l-4.707 4.707C14.077 11.337 13 11.851 13 13a1 1 0 01-2 0c0-1.149-1.077-1.663-1.707-1.293L5.586 15zM17 8a1 1 0 10-2 0v3a1 1 0 102 0V8zM7 9a1 1 0 00-2 0v2a1 1 0 102 0V9z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoOff ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            )}
          </button>

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700"
            title="End call"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              <path d="M16.707 3.293a1 1 0 010 1.414L15.414 6l1.293 1.293a1 1 0 01-1.414 1.414L14 7.414l-1.293 1.293a1 1 0 11-1.414-1.414L12.586 6l-1.293-1.293a1 1 0 011.414-1.414L14 4.586l1.293-1.293a1 1 0 011.414 0z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
