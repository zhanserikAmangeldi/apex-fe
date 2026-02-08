import './index.css'
import 'tippy.js/dist/tippy.css';
import {createRoot} from "react-dom/client";
import {StrictMode} from "react";
import App from "./App.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
