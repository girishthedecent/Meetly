import React from 'react'
import withAuth from '../utils/withAuth.jsx'
import { useNavigate } from 'react-router-dom';
import "../App.css";

import { IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { Button } from '@mui/material';
import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';



function HomeComponent() {

    let navigate = useNavigate();

    const [meetingCode, setMeetingCode] = useState("");


    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        try {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        }
        catch (e) {
            console.log(e);
        }


    }


    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h1>Meetly</h1>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={() => {
                        navigate("/history")
                    }}>
                        <RestoreIcon />
                        <p>History</p>
                    </IconButton>
                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth");

                    }}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">

                    <h2  >Most Trusted Video Calling Platform &nbsp; &nbsp;</h2>
                    <div style={{ display: "flex", gap: '10px' }}>
                        <TextField onChange={(e) => {
                            setMeetingCode(e.target.value);
                        }}
                            id="outlined-basic"
                            label="Meeting Code"
                            variant="outlined"
                            InputProps={{ style: { color: "white" } }}
                            InputLabelProps={{ style: { color: "white" } }}

                        />
                        <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
                    </div>

                </div>
                <div className="right-panel">
                    <img className="logo" srcSet="/videoe.svg" alt="" />
                </div>
            </div>





        </>
    )
}

export default withAuth(HomeComponent);
