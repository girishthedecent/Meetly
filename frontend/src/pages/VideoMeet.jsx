import TextField from '@mui/material/TextField';
import io from "socket.io-client";

import React, { use } from 'react'

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


import { Button } from '@mui/material';
import { Badge, IconButton } from '@mui/material';
import { Input } from '@mui/material';

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


const server_url = server;

var connections = {}

const peerConfigConnections = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};






export default function VideoMeetComponent() {

    var socketRef = useRef();
    var socketIdRef = useRef();

    var localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    const getPermissions = async () => {

        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (videoPermission) {
                setVideoAvailable(true);
            }
            else {
                setVideoAvailable(false);
            }
            if (audioPermission) {
                setAudioAvailable(true);
            }
            else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {

                setScreenAvailable(true);
            }
            else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });

                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        }
        catch (err) {

            console.log(err);

        }
    }

    useEffect(() => {

        getPermissions();

    }, []);

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach((track) => track.stop());

        }
        catch (err) {
            console.log(err);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) {
                continue;
            }
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(err => console.log(err));

            })
        }
        stream.getTracks().forEach((track) => track.onended = () => {
            setVideo(false)
            setAudio(false);
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            catch (err) {
                console.log(err);
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for (let id in connections) {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        })
                        .catch(err => console.log(err));
                })
            }
        })


    }
    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();

        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }

    let black = ({ width = 640, height = 480 } = {}) => {

        let canvas = Object.assign(document.createElement('canvas'), { width, height });

        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });

    }

    let getUserMedia = () => {
        if (video && videoAvailable || audio && audioAvailable) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch(err => console.log(err));

        }
        else {
            try {

                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());

            }
            catch (err) {
                console.log(err);
            }

        }
    }


    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video]);


    let gotMessageServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {
                        if (signal.sdp.type === "offer") {
                            connections[fromId].createAnswer().then((description) => {
                                connections[fromId].setLocalDescription(description)
                                    .then(() => {
                                        socketRef.current.emit("signal", fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                                    })
                                    .catch(err => console.log(err));
                            }).catch(err => console.log(err));
                        }
                    }).catch(err => console.log(err));
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(err => console.log(err));
            }
        }
    }

    let addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }

        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevMessages) => prevMessages + 1)
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on("signal", gotMessageServer)
        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on("chat-message", addMessage)

            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => videos.filter((video) => { video.socketId !== id }));
            })
        })

        socketRef.current.on("user-joined", (id, clients) => {
            if (Array.isArray(clients)) {
                clients.forEach((socketListId) => {


                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    }


                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if (videoExists) {
                            setVideos(videos => {

                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }
                        else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }
                    };
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    }
                    else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }

                })
            }

            else {
                console.error('clients is not an array:', clients);
            }
            if (id === socketIdRef.current) {
                for (let id2 in connections) {
                    if (id2 === socketIdRef.current) {
                        continue;
                    }
                    try {
                        connections[id2].addStream(window.localStream);

                    }
                    catch {

                    }

                    connections[id2].createOffer().then((description) => {
                        connections[id2].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit("signal", id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                            })
                            .catch(err => console.log(err));

                    })

                }
            }

        })


    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);

        connectToSocketServer();
    }

    let routeTo = useNavigate();

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }
    let handleAudio = () => {
        setAudio(!audio);
    }


    let getDisplayMediaSuccess = (stream) => {

        try {
            window.localStream.getTracks().forEach((track) => track.stop());
        }
        catch (err) {
            console.log(err);
        }
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) {
                continue;
            }
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(err => console.log(err));
            }).catch(err => console.log(err));
        }
        stream.getTracks().forEach((track) => track.onended = () => {
            setScreen(false);
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            catch (err) {
                console.log(err);
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch(err => console.log(err));
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    })

    let handleScreen = () => {
        setScreen(!screen);
    }

    let sendMessage = () => {

        socketRef.current.emit("chat-message", message, username);
        setMessage('');
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        catch (err) {
            console.log(err);
        }
        routeTo("/home")
    }


    return (
        <div>

            {askForUsername === true ?

                <div className={styles.starting} >

                    <TextField
                        id="outlined-basic"
                        required
                        label="Username"
                        value={username}
                        variant="outlined"
                        onChange={(e) => setUsername(e.target.value)}
                        InputProps={{ style: { color: "white" } }}
                        InputLabelProps={{ style: { color: "white" } }}

                    />
                    <br />
                    <br />
                    <Button variant="contained" onClick={connect}>Join</Button>

                    <br /> <br />

                    <div className={styles.videoStart}>
                        <video ref={localVideoRef} autoPlay muted></video>
                    </div>

                </div> :
                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>
                        <div className={styles.chatContainer}>
                            <h1> &nbsp;Chat</h1>
                            <br />
                            <div className={styles.chattingdisplay}>

                                {messages.length > 0 ? messages.map((item, index) => {
                                    return <div style={{ marginBottom: '10px' }} key={index} >
                                        <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{item.sender} </p>
                                        <p>{item.data}</p>
                                    </div>
                                }) : <div>No messages</div>}

                            </div>
                            <div className={styles.chattingArea}>

                                <TextField id='outlined-basic'
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    label="Enter Your Chat"
                                    variant="outlined"

                                    InputProps={{ style: { color: "white" } }}
                                    InputLabelProps={{ style: { color: "white" } }} />
                                <Button style={{ marginLeft: '14px' }} type="button" variant="contained" onClick={() => { sendMessage() }}>Send</Button>

                            </div>

                        </div>
                    </div> : <></>}

                    <div className={styles.buttonContainers}  >
                        <IconButton onClick={handleVideo} style={{ color: 'white' }} >
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: 'red' }}  >
                            <CallEndIcon />     </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: 'white' }} >
                            {(audio === true) ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ? <IconButton onClick={handleScreen} style={{ color: 'white' }} >
                            <ScreenShareIcon />
                        </IconButton> : <IconButton style={{ color: 'white' }} >
                            <StopScreenShareIcon />
                        </IconButton>}
                        <Badge badgeContent={newMessages} max={999} color="primary">
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: 'white' }} >
                                <ChatIcon />
                            </IconButton>

                        </Badge>

                    </div>


                    <video
                        className={screen ? styles.meetScreenVideo : styles.meetUserVideo}
                        ref={localVideoRef}
                        autoPlay
                        muted
                    ></video>

                    <div className={styles.conferenceView}  >
                        {videos.map((video) => (
                            <div key={video.socketId} >

                                <video className={styles.each}
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>
                        ))}
                    </div>

                </div>

            }


        </div>)
}
