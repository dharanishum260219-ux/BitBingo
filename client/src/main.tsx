import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./index.css"
import { ArenaProvider } from "./state"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ArenaProvider>
        <App />
      </ArenaProvider>
    </BrowserRouter>
  </React.StrictMode>
)
