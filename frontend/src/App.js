import './App.css';
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Upload from './pages/upload';
import RenderProgress from './pages/renderProgress';
import DownloadFile from './pages/download';

function App() {
  return(
    <Router>
      <Routes>
        <Route path = '/' element = { <Upload/>} />
        <Route path = 'render/:id' element = { <RenderProgress/> } />
        <Route path = 'download/:id' element = { <DownloadFile/> } />
      </Routes>
    </Router>
  )
}

export default App;