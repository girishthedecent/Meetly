import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Badge, Button, IconButton, TextField } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import server from '../environment';
import styles from '../styles/VideoComponent.module.css';

const serverUrl = server;
let connections = {};

const peerConfigConnections = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302',
        },
    ],
};

const ConferenceStage = React.memo(function ConferenceStage({ localVideoRef, screen, videos }) {
    const conferenceClassName = [
        styles.conferenceView,
        videos.length === 0 ? styles.conferenceEmptyView : '',
        videos.length === 1 ? styles.conferenceSolo : '',
        videos.length > 1 ? styles.conferenceGrid : '',
    ].filter(Boolean).join(' ');

    return (
        <>
            <video
                className={screen ? styles.meetScreenVideo : styles.meetUserVideo}
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
            ></video>

            <div className={styles.stageShell}>
                <div className={conferenceClassName}>
                    {videos.length > 0 ? videos.map((video) => (
                        <div
                            className={videos.length === 1 ? styles.videoTileSolo : styles.videoTile}
                            key={video.socketId}
                        >
                            <video
                                data-socket={video.socketId}
                                ref={(ref) => {
                                    if (ref && video.stream) {
                                        ref.srcObject = video.stream;
                                    }
                                }}
                                autoPlay
                                playsInline
                            ></video>
                        </div>
                    )) : (
                        <div className={styles.emptyStage}>
                            <h3>Waiting for others to join</h3>
                            <p>Share the meeting link to start the call.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
});

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoRef = useRef();
    const videoRef = useRef([]);
    const chatMessagesRef = useRef(null);
    const showChatRef = useRef(false);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState();
    const [audio, setAudio] = useState();
    const [screen, setScreen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState('');
    const [videos, setVideos] = useState([]);

    const routeTo = useNavigate();

    useEffect(() => {
        showChatRef.current = showChat;
    }, [showChat]);

    const stopLocalTracks = () => {
        try {
            const tracks = localVideoRef.current?.srcObject?.getTracks() || [];
            tracks.forEach((track) => track.stop());
        } catch (err) {
            console.log(err);
        }
    };

    const cleanupConnections = () => {
        Object.values(connections).forEach((connection) => {
            try {
                connection.close();
            } catch (err) {
                console.log(err);
            }
        });
        connections = {};
        videoRef.current = [];
        setVideos([]);
    };

    const silence = () => {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement('canvas'), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const ensureFallbackStream = () => {
        const blackSilence = (...args) => new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
        }
    };

    const getPermissions = async () => {
        try {
            let hasVideo = false;
            let hasAudio = false;

            try {
                const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
                videoPermission.getTracks().forEach((track) => track.stop());
                hasVideo = true;
            } catch (err) {
                hasVideo = false;
            }

            try {
                const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioPermission.getTracks().forEach((track) => track.stop());
                hasAudio = true;
            } catch (err) {
                hasAudio = false;
            }

            setVideoAvailable(hasVideo);
            setAudioAvailable(hasAudio);
            setScreenAvailable(Boolean(navigator.mediaDevices.getDisplayMedia));

            if (hasVideo || hasAudio) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: hasVideo,
                    audio: hasAudio,
                });

                window.localStream = userMediaStream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = userMediaStream;
                }
            } else {
                ensureFallbackStream();
            }
        } catch (err) {
            console.log(err);
            ensureFallbackStream();
        }
    };

    useEffect(() => {
        getPermissions();

        return () => {
            stopLocalTracks();
            cleanupConnections();
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const pushStreamToConnections = (stream) => {
        for (const id in connections) {
            if (id === socketIdRef.current) {
                continue;
            }

            connections[id].addStream(stream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }));
                    })
                    .catch((err) => console.log(err));
            }).catch((err) => console.log(err));
        }
    };

    const getUserMediaSuccess = (stream) => {
        stopLocalTracks();

        window.localStream = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        pushStreamToConnections(stream);

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);
                stopLocalTracks();
                ensureFallbackStream();
                pushStreamToConnections(window.localStream);
            };
        });
    };

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video, audio })
                .then(getUserMediaSuccess)
                .catch((err) => console.log(err));
            return;
        }

        stopLocalTracks();
        ensureFallbackStream();
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video]);

    const gotMessageServer = (fromId, incomingMessage) => {
        const signal = JSON.parse(incomingMessage);

        if (fromId === socketIdRef.current) {
            return;
        }

        if (signal.sdp) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
                                })
                                .catch((err) => console.log(err));
                        }).catch((err) => console.log(err));
                    }
                }).catch((err) => console.log(err));
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch((err) => console.log(err));
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender, data },
        ]);

        if (socketIdSender !== socketIdRef.current && !showChatRef.current) {
            setNewMessages((prevMessages) => prevMessages + 1);
        }
    };

    const connectToSocketServer = () => {
        if (socketRef.current?.connected) {
            return;
        }

        cleanupConnections();

        socketRef.current = io.connect(serverUrl, { secure: false });
        socketRef.current.on('signal', gotMessageServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((prevVideos) => prevVideos.filter((videoItem) => videoItem.socketId !== id));
                videoRef.current = videoRef.current.filter((videoItem) => videoItem.socketId !== id);
                if (connections[id]) {
                    try {
                        connections[id].close();
                    } catch (err) {
                        console.log(err);
                    }
                    delete connections[id];
                }
            });
        });

        socketRef.current.on('user-joined', (id, clients) => {
            if (!Array.isArray(clients)) {
                console.error('clients is not an array:', clients);
                return;
            }

            clients.forEach((socketListId) => {
                if (connections[socketListId]) {
                    return;
                }

                connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                connections[socketListId].onicecandidate = (event) => {
                    if (event.candidate) {
                        socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }));
                    }
                };

                connections[socketListId].onaddstream = (event) => {
                    const videoExists = videoRef.current.find((videoItem) => videoItem.socketId === socketListId);

                    if (videoExists) {
                        setVideos((currentVideos) => {
                            const updatedVideos = currentVideos.map((videoItem) => (
                                videoItem.socketId === socketListId ? { ...videoItem, stream: event.stream } : videoItem
                            ));
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                        return;
                    }

                    const newVideo = {
                        socketId: socketListId,
                        stream: event.stream,
                        autoPlay: true,
                        playsInline: true,
                    };

                    setVideos((currentVideos) => {
                        const updatedVideos = [...currentVideos, newVideo];
                        videoRef.current = updatedVideos;
                        return updatedVideos;
                    });
                };

                if (window.localStream) {
                    connections[socketListId].addStream(window.localStream);
                } else {
                    ensureFallbackStream();
                    connections[socketListId].addStream(window.localStream);
                }
            });

            if (id === socketIdRef.current) {
                for (const connectionId in connections) {
                    if (connectionId === socketIdRef.current) {
                        continue;
                    }

                    try {
                        connections[connectionId].addStream(window.localStream);
                    } catch (err) {
                        console.log(err);
                    }

                    connections[connectionId].createOffer().then((description) => {
                        connections[connectionId].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', connectionId, JSON.stringify({ sdp: connections[connectionId].localDescription }));
                            })
                            .catch((err) => console.log(err));
                    }).catch((err) => console.log(err));
                }
            }
        });
    };

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const connect = () => {
        const trimmedUsername = username.trim() || 'Guest';
        setUsername(trimmedUsername);
        setAskForUsername(false);
        getMedia();
    };

    const handleVideo = () => {
        setVideo((prevVideo) => !prevVideo);
    };

    const handleAudio = () => {
        setAudio((prevAudio) => !prevAudio);
    };

    const getDisplayMediaSuccess = (stream) => {
        stopLocalTracks();
        window.localStream = stream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        pushStreamToConnections(stream);

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setScreen(false);
                stopLocalTracks();
                ensureFallbackStream();
                getUserMedia();
            };
        });
    };

    const getDisplayMedia = () => {
        if (!screen || !navigator.mediaDevices.getDisplayMedia) {
            return;
        }

        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            .then(getDisplayMediaSuccess)
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen]);

    useEffect(() => {
        if (showChat) {
            setNewMessages(0);
        }
    }, [showChat]);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages, showChat]);

    const handleScreen = () => {
        setScreen((prevScreen) => !prevScreen);
    };

    const sendMessage = () => {
        const trimmedMessage = message.trim();

        if (!trimmedMessage || !socketRef.current) {
            return;
        }

        socketRef.current.emit('chat-message', trimmedMessage, username || 'Guest');
        setMessage('');
    };

    const handleChatToggle = () => {
        setShowChat((prev) => !prev);
    };

    const handleEndCall = () => {
        stopLocalTracks();
        cleanupConnections();
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        routeTo('/home');
    };

    const containerClassName = showChat
        ? styles.meetVideoContainer + ' ' + styles.chatOpen
        : styles.meetVideoContainer;

    return (
        <div>
            {askForUsername ? (
                <div className={styles.starting}>
                    <div className={styles.joinCard}>
                        <h1 className={styles.joinTitle}>Join Meeting</h1>
                        <p className={styles.joinSubtitle}>Choose a name and enter the room.</p>

                        <TextField
                            id="outlined-basic"
                            required
                            label="Username"
                            value={username}
                            variant="outlined"
                            onChange={(e) => setUsername(e.target.value)}
                            InputProps={{ style: { color: 'white' } }}
                            InputLabelProps={{ style: { color: 'white' } }}
                            fullWidth
                        />

                        <div className={styles.joinActions}>
                            <Button variant="contained" onClick={connect}>Join</Button>
                        </div>
                    </div>

                    <div className={styles.videoStart}>
                        <video ref={localVideoRef} autoPlay muted playsInline></video>
                    </div>
                </div>
            ) : (
                <div className={containerClassName}>
                    <ConferenceStage localVideoRef={localVideoRef} screen={screen} videos={videos} />

                    {showChat ? (
                        <aside className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <div className={styles.chatHeader}>
                                    <h1>Chat</h1>
                                </div>

                                <div className={styles.chattingdisplay} ref={chatMessagesRef}>
                                    {messages.length > 0 ? messages.map((item, index) => (
                                        <div className={styles.chatMessage} key={index}>
                                            <p className={styles.chatSender}>{item.sender}</p>
                                            <p className={styles.chatText}>{item.data}</p>
                                        </div>
                                    )) : <div className={styles.emptyChat}>No messages yet</div>}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        id="outlined-basic"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        label="Enter your chat"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        InputProps={{ style: { color: 'white' } }}
                                        InputLabelProps={{ style: { color: 'white' } }}
                                    />
                                    <Button className={styles.sendButton} type="button" variant="contained" onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </aside>
                    ) : null}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: 'white' }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: 'red' }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: 'white' }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {screenAvailable ? (
                            <IconButton onClick={handleScreen} style={{ color: 'white' }}>
                                <ScreenShareIcon />
                            </IconButton>
                        ) : (
                            <IconButton style={{ color: 'white' }}>
                                <StopScreenShareIcon />
                            </IconButton>
                        )}
                        <Badge badgeContent={newMessages} max={999} color="primary">
                            <IconButton onClick={handleChatToggle} style={{ color: 'white' }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>
                </div>
            )}
        </div>
    );
}
