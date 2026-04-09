import { GameProvider } from "./hooks/useGameState";
import Dashboard from "./components/layout/Dashboard";

/**
 * アプリルート
 * URLパラメータ ?mode=bet でBETモード、なしで単勝モード
 */
function App() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") === "bet" ? "bet" : "simple";

  return (
    <GameProvider mode={mode}>
      <Dashboard />
    </GameProvider>
  );
}

export default App;
