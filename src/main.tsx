import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { seedIfEmpty } from "./lib/seeding";

// On seed AVANT le premier render pour que les hooks lisent déjà les données.
void seedIfEmpty().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
