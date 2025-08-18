"use client"

import { useRef } from "react"
import "./Transition.css"

const Transition = ({
  transition,
  onLeftMouseDown,
  onLeftMouseUp,
  onRightClick,
  onLeftClick,
  selected,
  isConnecting,
  isDragged,
  isEnabled,
  isFiring,
  onUpdate,
}) => {
  const transitionRef = useRef(null)

  const handleMouseDown = (event) => {
    event.stopPropagation()

    if (event.button === 0) {
      onLeftMouseDown(event)
    }
  }

  const handleMouseUp = (event) => {
    if (event.button === 0) {
      onLeftMouseUp()
    } else if (event.button === 2) {
      onRightClick(event)
    }
  }

  const handleClick = (event) => {
    event.stopPropagation()
    onLeftClick && onLeftClick(event)
  }

  const handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onRightClick(event)
  }

  const handleUpdate = (updates) => {
    console.log("handle update transition...")
    onUpdate(transition.id, updates, "transition")
  }

  // Adjust positioning based on orientation
  const isLandscape = transition.orientation === "landscape"
  const offsetX = isLandscape ? 28 : 18 // Half of 56px (landscape) or 36px (portrait)
  const offsetY = isLandscape ? 18 : 28 // Half of 36px (landscape) or 56px (portrait)

  const getTransitionClasses = () => {
    let classes = `transition petri-element ${selected ? "selected" : ""} ${isConnecting ? "connecting" : ""} ${isDragged ? "dragged" : ""} ${isLandscape ? "landscape" : "portrait"}`

    if (isEnabled) classes += " enabled"
    if (isFiring) classes += " firing"

    return classes
  }

  return (
    <div
      ref={transitionRef}
      className={getTransitionClasses()}
      style={{
        left: transition.position.x - offsetX,
        top: transition.position.y - offsetY,
        cursor: isDragged ? "grabbing" : isConnecting ? "crosshair" : "pointer",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={transition.label}
    >
      <div className="transition-rect" onClick={() => handleUpdate({ type: "timed" })}>
        {transition.type === "timed" && <div className="transition-timer">⏱</div>}
      </div>
      <div className="transition-label">{transition.label}</div>
    </div>
  )
}

export default Transition
