import './App.css';
import { useState } from 'react'

const API_URL = process.env.REACT_APP_API_URL || 'localhost'

/*

NPM BUILD YOU FUCKING RETARD





*/

function App() {

  const [blendFile, setBlendFile] = useState({ preview: '', data: '' })
  const [status, setStatus] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    let formData = new FormData()
    formData.append('file', blendFile.data)
    const response = await fetch(`http://${API_URL}:8000/uploadBlends`, {
      method: 'POST',
      body: formData,
    })
    if (response) setStatus(response.statusText)
  }

  const handleFileChange = (e) => {
    const blend = {
      preview: URL.createObjectURL(e.target.files[0]),
      data: e.target.files[0],
    }
    setBlendFile(blend)
  }

  return (
    <div className='App'>
      <h1>Upload to server</h1>
      <hr></hr>
      <form onSubmit={handleSubmit}>
        <input type='file'
               name='file' 
               accept=".blend"
               onChange={handleFileChange}></input>
        <button type='submit'>Submit</button>
      </form>
      {status && <h4>{status}</h4>}
    </div>
  )
}

export default App;
