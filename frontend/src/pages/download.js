import React from 'react'
import { useParams } from "react-router-dom";
import { Button } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css"; 

var API_URL;

if (window.env.API_URL === '_API_URL_') {
  API_URL = process.env.REACT_APP_API_URL
}
else {
  API_URL = window.env.API_URL
}

function DownloadFile() {
    const [URL, setURL] = React.useState({'URL' : null});
    const {id} = useParams();
    
    async function getFile() {
        const response = await fetch(`http://${API_URL}:8000/preURL/${id}`);
        const responseURL = (await response.json())['URL']
        setURL(responseURL)
    };

    getFile()

    console.log(`URL >> ${URL}`);

    return(
      <div style={{"margin" : "35px"}}> 
        <button
          type="button"
          onClick={(e) => {e.preventDefault();
            window.location.href=URL;
            }}
          > Download Video
        </button>
      </div>
    )
}

export default DownloadFile