import React from 'react'
import { useInterval } from "./useInterval";
import { useParams } from "react-router-dom";
import { ProgressBar } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css"; 
import { useNavigate } from "react-router-dom";

var API_URL;

if (window.env.API_URL === '_API_URL_') {
  API_URL = process.env.REACT_APP_API_URL
}
else {
  API_URL = window.env.API_URL
}

function RenderProgress() {
    const [progress, setProgress] = React.useState({'framesCompleted' : 0,
                                                    'totalFrames': 1,
                                                    'renderDone': false});
    const {id} = useParams()
    const navigate = useNavigate();

    useInterval(async () => {
        if(progress['renderDone']) {
            navigate(`/download/${id}`)
            return
        }
        const renderProg = await fetch(`http://${API_URL}:8000/render/${id}`)
        setProgress(await renderProg.json())
    }, 2000)

    useInterval()

    var progressGoal = Math.max(1, (progress['framesCompleted'] / progress['totalFrames'] ) * 100);

    const progBarStyle = {
        "animationDirection": "reverse"
    };

    return(
        <div style={{"padding": "20px"}}> 
            <h2> Rendering... </h2>
                <div className="progressBar" style={{"padding": "10px"}}>
                    <ProgressBar now={progressGoal} 
                                 animated style={progBarStyle}/>
                </div>
        </div>
    )
}

export default RenderProgress