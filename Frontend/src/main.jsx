import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "@fontsource/inter/400.css"; // regular
import "@fontsource/inter/500.css"; // medium
import "@fontsource/inter/600.css"; // semibold
import "@fontsource/inter/700.css"; // bold

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
