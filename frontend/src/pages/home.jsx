import React, { useState, useContext } from 'react';
import withAuth from '../utils/withAuth.jsx';
import { useNavigate } from 'react-router-dom';
import '../App.css';

import { IconButton, TextField, Button } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext.jsx';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    const { addToUserHistory } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        try {
            await addToUserHistory(meetingCode);
            navigate('/' + meetingCode);
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <>
            <div className="navBar">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1>Meetly</h1>
                </div>
                <div className="navActions">
                    <IconButton
                        className="historyTrigger"
                        onClick={() => {
                            navigate('/history');
                        }}
                    >
                        <RestoreIcon />
                        <p>History</p>
                    </IconButton>
                    <Button
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/auth');
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <h2>Most Trusted Video Calling Platform</h2>
                    <div className="meetingForm">
                        <TextField
                            onChange={(e) => {
                                setMeetingCode(e.target.value);
                            }}
                            id="outlined-basic"
                            label="Meeting Code"
                            variant="outlined"
                            InputProps={{ style: { color: 'white' } }}
                            InputLabelProps={{ style: { color: 'white' } }}
                        />
                        <Button onClick={handleJoinVideoCall} variant="contained">Join</Button>
                    </div>
                </div>
                <div className="rightPanel">
                    <img className="logo" srcSet="/videoe.svg" alt="Video calling illustration" />
                </div>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);
