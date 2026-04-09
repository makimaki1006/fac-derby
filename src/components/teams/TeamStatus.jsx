import { useGame } from "../../hooks/useGameState";
import { teams } from "../../data/questions";

/**
 * 全19チームの回答状況を横型コンパクトバッジで表示
 */
export default function TeamStatus() {
  const { state } = useGame();

  return (
    <section className="team-bar" aria-label="チーム回答状況">
      <span className="team-bar__label">チーム</span>
      <div className="team-bar__list">
        {teams.map((team) => {
          const answered = state.teamAnswers[team.id] !== undefined;
          return (
            <span
              key={team.id}
              className={`team-bar__chip ${answered ? "team-bar__chip--done" : ""}`}
              style={{
                backgroundColor: answered ? team.color : "transparent",
                borderColor: team.color,
              }}
              title={`${team.name}: ${answered ? "回答済み" : "未回答"}`}
            >
              {team.name}
            </span>
          );
        })}
      </div>
    </section>
  );
}
