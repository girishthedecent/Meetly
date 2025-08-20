import React from "react";

import "../App.css"
import { Link, useNavigate} from 'react-router-dom'
import { Button } from "@mui/material";
export default function LandingPage() {
    const router=useNavigate();
    return (
        <div className="landingPageContainer">
           <nav>
            <div className="navHeader">
                <h2>
                     Meetly
                </h2>
            </div>
            <div className="navlist">
                <Button onClick={()=>{
                    router("/guest");
                }}>Join as guest</Button>
                <Button  onClick={()=>router("/auth")}>Register</Button>
                <Button onClick={()=>router("/auth")}>Login</Button>
            </div>

           </nav>
           <div className="landingMainContainer">
            <div>
                <h1>
                    <span style={{color:'#ff9839'}}>Connection Made Simple</span>
                </h1>
                <p className="cover">
                    Cover your distance with Meetly
                </p>
                <div role="button">
                    <Link to={"/auth"}>Get Started</Link>
                </div>
                

            </div>
            <div className="mobile">
                <img src="/mobile.png" alt="" />
            </div>

           </div>
        </div>
    )
    
}