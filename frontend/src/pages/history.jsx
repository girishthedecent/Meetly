import React, { useEffect } from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx'
import { useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';

import { Button } from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';
import '../App.css';


export default function History() {
    const { getHistoryofUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([]);

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryofUser();

                setMeetings(history);
            } catch (error) {
                console.error(error);
            }
        }
        fetchHistory();
    }, []);


    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        return `${day}-${month}-${year}`
    }



    return (
        <div  className='history'>
            <div className='homeIcon'> 
            <IconButton  onClick={() => { routeTo(`/home`) }}>
                <HomeIcon /> 
            </IconButton> <b>Home</b> </div>
            {
                meetings.map((e, i) => {
                    return (
                        <div key={i} className='card' >
                          


                            <h2 style={{fontWeight:"lighter",fontSize:"1.3rem"}}>Meeting Code : <b><i>{e.meetingCode}</i></b></h2>
                            <br />
                            <br />

                           
                            <h4 style={{fontWeight:"lighter"}}>Date : {formatDate(e.date)}</h4>


                        </div>
                    )

                }
                )
            }

        </div>
    )
}
