import { GameProvider } from "./hooks/useGameState";
import Dashboard from "./components/layout/Dashboard";

function App() {
  return (
    <GameProvider mode="bet">
      <Dashboard />
    </GameProvider>
  );
}

export default App;
