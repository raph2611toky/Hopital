"use client"

import { useState, useRef } from "react"
import "./Place.css"

const Place = ({ place, onSelect, onStartConnection, onEndConnection, onContextMenu, selected, isConnecting }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const placeRef = useRef(null)

  const handleMouseDown = (event) => {
    if (event.button === 0) {
      event.stopPropagation()

      if (event.shiftKey) {
        // Mode connexion avec Shift+clic
        onStartConnection()
      } else {
        // Mode sélection/drag
        onSelect()
        setIsDragging(true)
        const rect = placeRef.current.getBoundingClientRect()
        setDragOffset({
          x: event.clientX - rect.left - rect.width / 2,
          y: event.clientY - rect.top - rect.height / 2,
        })
      }
    }
  }

  const handleMouseUp = (event) => {
    if (isConnecting) {
      onEndConnection()
    }
    setIsDragging(false)
  }

  const renderTokens = () => {
    const tokens = []
    const tokenCount = Math.min(place.tokens, 9) // Limite d'affichage

    if (tokenCount === 0) return null

    if (tokenCount === 1) {
      tokens.push(<div key="token-1" className="token center" />)
    } else if (tokenCount <= 4) {
      const positions = [
        { top: "25%", left: "25%" },
        { top: "25%", right: "25%" },
        { bottom: "25%", left: "25%" },
        { bottom: "25%", right: "25%" },
      ]

      for (let i = 0; i < tokenCount; i++) {
        tokens.push(<div key={`token-${i}`} className="token" style={positions[i]} />)
      }
    } else {
      // Affichage du nombre pour plus de 4 jetons
      tokens.push(
        <div key="token-count" className="token-count">
          {place.tokens}
        </div>,
      )
    }

    return tokens
  }

  return (
    <div
      ref={placeRef}
      className={`place petri-element ${selected ? "selected" : ""} ${isConnecting ? "connecting" : ""}`}
      style={{
        left: place.position.x - 30,
        top: place.position.y - 30,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={onContextMenu}
      title={place.label}
    >
      <div className="place-circle">{renderTokens()}</div>
      <div className="place-label">{place.label}</div>

      {/* Points de connexion */}
      <div className="connection-point top" />
      <div className="connection-point right" />
      <div className="connection-point bottom" />
      <div className="connection-point left" />
    </div>
  )
}

export default Place
