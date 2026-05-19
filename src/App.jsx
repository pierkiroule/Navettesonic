import { useState } from "react";
import Home from "./pages/Home.jsx";
import SoonApp from "./pages/SoonApp.jsx";

export default function App() {
  const [screen, setScreen] = useState("home");

  return (
    <>
      {screen === "home" && <Home onEnter={() => setScreen("soon")} />}
      {screen === "soon" && <SoonApp onBack={() => setScreen("home")} />}
    </>
  );
}
