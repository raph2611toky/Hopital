"use client"

import { useState, useRef } from "react"
import "./Transition.css"

const Transition = ({
  transition,
  onSelect,
  onStartConnection,
  onEndConnection,
  onContextMenu,
  selected,
  isConnecting,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const transitionRef = useRef(null)

  const handleMouseDown = (event) => {
    if (event.button === 0) {
      event.stopPropagation()

      if (event.shiftKey) {
        // Mode connexion avec Shift+clic
        onStartConnection()
      } else {
        // Mode sélection
        onSelect()
        setIsDragging(true)
      }
    }
  }

  const handleMouseUp = (event) => {
    if (isConnecting) {
      onEndConnection()
    }
    setIsDragging(false)
  }

  return (
    <div
      ref={transitionRef}
      className={`transition petri-element ${selected ? "selected" : ""} ${isConnecting ? "connecting" : ""}`}
      style={{
        left: transition.position.x - 15,
        top: transition.position.y - 25,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={onContextMenu}
      title={transition.label}
    >
      <div className="transition-rect">{transition.type === "timed" && <div className="transition-timer">⏱</div>}</div>
      <div className="transition-label">{transition.label}</div>

      {/* Points de connexion */}
      <div className="connection-point top" />
      <div className="connection-point right" />
      <div className="connection-point bottom" />
      <div className="connection-point left" />
    </div>
  )
}

export default Transition
