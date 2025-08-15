"use client"
import "./SimulationControls.css"

const SimulationControls = ({ onPlay, onPause, onStep, isPlaying }) => {
  return (
    <div className="simulation-controls">
      <button
        className={`control-button ${isPlaying ? "active" : ""}`}
        onClick={isPlaying ? onPause : onPlay}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <button className="control-button" onClick={onStep} title="Step" disabled={isPlaying}>
        ⏭
      </button>
    </div>
  )
}

export default SimulationControls
