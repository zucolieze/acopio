import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/tokens.css'
import '@/shared/styles/base.css'
import App from './App'
import '@/App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
