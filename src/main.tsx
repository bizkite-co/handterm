import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './terminal/App.tsx'
// import './assets/index.css'
// import './assets/App.css'
import './assets/xterm.css'
import './assets/terminal.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
