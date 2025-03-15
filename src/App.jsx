import { useState } from "react";
import "./App.css";
import SolarSystem from "./components/SolarSystem";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <SolarSystem />
    </>
  );
}

export default App;
