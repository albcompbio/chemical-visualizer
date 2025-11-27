import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import './index.css'

// Configure Axios for Electron environment
if (window.electronAPI) {
    axios.defaults.baseURL = 'http://localhost:8000';
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
