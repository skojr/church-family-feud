import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import HostView from './components/HostView.jsx'

const isHostView = new URLSearchParams(window.location.search).get('view') === 'host'

createRoot(document.getElementById('root')).render(
  <StrictMode>{isHostView ? <HostView /> : <App />}</StrictMode>,
)
