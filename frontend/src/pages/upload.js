import React from 'react'
import { useNavigate } from "react-router-dom";

var API_URL;

if (window.env.API_URL === '_API_URL_') {
  API_URL = process.env.REACT_APP_API_URL
}
else {
  API_URL = window.env.API_URL
}

function Upload() {
  const [file, setFile] = React.useState();
  const uploadRef = React.useRef();
  const statusRef = React.useRef();
  const loadTotalRef = React.useRef();
  const progressRef = React.useRef();

  const navigate = useNavigate();
  
  const UploadFile = () => {
    const file = uploadRef.current.files[0];
    setFile(URL.createObjectURL(file));
    var formData = new FormData();
    formData.append('file', file);
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", ProgressHandler, false);
    xhr.addEventListener("load", SuccessHandler, false);
    xhr.addEventListener("error", ErrorHandler, false);
    xhr.addEventListener("abort", AbortHandler, false);
    xhr.open("POST", `http://${API_URL}:8000/uploadBlends`);
    xhr.send(formData);
  };

  const ProgressHandler = (e) => {
    loadTotalRef.current.innerHTML = `Uploaded ${(e.loaded)/1000} KBs of ${(e.total)/1000}`;
    var percent = (e.loaded / e.total) * 100;
    progressRef.current.value = Math.round(percent);
    statusRef.current.innerHTML = Math.round(percent) + "% uploaded...";
  };

  const SuccessHandler = async (e) => {
    var response =  JSON.parse(e.target.responseText);
    statusRef.current.innerHTML = e.target.responseText;
    progressRef.current.value = 0;
    await new Promise(r => setTimeout(r, 500))
    navigate(`/render/${response['renderID']}`)
  };

  const ErrorHandler = () => {
    statusRef.current.innerHTML = "upload failed!!";
  };

  const AbortHandler = () => {
    statusRef.current.innerHTML = "upload aborted!!";
  };

  return (
    <div className='App'>
      <title className="navbar-brand">CAB432 Assignment 2: Blender Render Farm</title>
      <h1>Blender Animator</h1>
      <h4>Upload Blender Animation</h4>
      <hr></hr>
        <input type='file'
               name='file' 
               accept=".blend"
               ref={uploadRef}
               onChange={UploadFile}
        >
        </input>
        <div style={{"margin" : "15px"}}>
            <progress style = {{"width" : "450px", "height" : "40px"}}
                      ref={progressRef} 
                      value="0" 
                      max="100" />
        </div>
        <p ref={loadTotalRef}></p>
        <p ref={statusRef}></p>
        <hr></hr>
        <h4>Example Blend Files</h4>
        <a href="https://cab432-markouksanovic.s3.ap-southeast-2.amazonaws.com/examples/fast_cube.blend" download> Fast Cube </a>
        <br></br>
        <a href="https://cab432-markouksanovic.s3.ap-southeast-2.amazonaws.com/examples/fast_cube.blend" download> Test </a>
    </div>
  )
}

export default Upload;