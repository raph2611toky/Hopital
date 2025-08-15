"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Place from "./Place"
import Transition from "./Transition"
import Arc from "./Arc"
import PropertiesPanel from "./PropertiesPanel"
import SimulationControls from "./SimulationControls"
import ContextMenu from "./ContextMenu"
import { PetriNet } from "../models/PetriNet"
import "./PetriEditor.css"

const PetriEditor = () => {
  const canvasRef = useRef(null)
  const netRef = useRef(new PetriNet())

  const [places, setPlaces] = useState([])
  const [transitions, setTransitions] = useState([])
  const [arcs, setArcs] = useState([])
  const [selected, setSelected] = useState(null)
  const [simulationInterval, setSimulationInterval] = useState(null)
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false, type: null })

  // États pour le zoom et le pan
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // États pour la création d'arcs
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [tempArc, setTempArc] = useState(null)

  // Gestion du clic droit sur le canvas
  const handleCanvasContextMenu = useCallback(
    (event) => {
      event.preventDefault()
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - transform.x) / transform.scale
      const y = (event.clientY - rect.top - transform.y) / transform.scale

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        visible: true,
        type: "canvas",
        position: { x, y },
      })
    },
    [transform],
  )

  // Gestion du zoom avec la molette
  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const delta = event.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.1, Math.min(3, transform.scale * delta))

      setTransform((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale,
      }))
    },
    [transform],
  )

  // Gestion du drag pour le pan
  const handleMouseDown = useCallback(
    (event) => {
      if (event.button === 0 && !event.target.closest(".petri-element")) {
        setIsDragging(true)
        setDragStart({ x: event.clientX - transform.x, y: event.clientY - transform.y })
      }
    },
    [transform],
  )

  const handleMouseMove = useCallback(
    (event) => {
      if (isDragging) {
        setTransform((prev) => ({
          ...prev,
          x: event.clientX - dragStart.x,
          y: event.clientY - dragStart.y,
        }))
      }

      // Mise à jour de l'arc temporaire pendant la connexion
      if (isConnecting && connectingFrom) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (event.clientX - rect.left - transform.x) / transform.scale
        const y = (event.clientY - rect.top - transform.y) / transform.scale

        setTempArc({
          from: connectingFrom.position,
          to: { x, y },
        })
      }
    },
    [isDragging, dragStart, isConnecting, connectingFrom, transform],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (isConnecting) {
      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    }
  }, [isConnecting])

  // Fermer le menu contextuel
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  // Ajouter une place
  const addPlace = useCallback(
    (position) => {
      const id = `p${Date.now()}`
      const newPlace = {
        id,
        label: `Place ${places.length + 1}`,
        tokens: 0,
        position,
        type: "resource",
        capacity: 10,
      }

      setPlaces((prev) => [...prev, newPlace])
      netRef.current.addPlace(newPlace)
      closeContextMenu()
    },
    [places.length, closeContextMenu],
  )

  // Ajouter une transition
  const addTransition = useCallback(
    (position) => {
      const id = `t${Date.now()}`
      const newTransition = {
        id,
        label: `Transition ${transitions.length + 1}`,
        position,
        type: "instant",
        delay: 0,
        priority: 1,
      }

      setTransitions((prev) => [...prev, newTransition])
      netRef.current.addTransition(newTransition)
      closeContextMenu()
    },
    [transitions.length, closeContextMenu],
  )

  // Commencer la connexion
  const startConnection = useCallback((element) => {
    setIsConnecting(true)
    setConnectingFrom(element)
  }, [])

  // Terminer la connexion
  const endConnection = useCallback(
    (targetElement) => {
      if (connectingFrom && targetElement && connectingFrom.id !== targetElement.id) {
        // Vérifier que la connexion est valide (place -> transition ou transition -> place)
        const sourceType = connectingFrom.type || (connectingFrom.tokens !== undefined ? "place" : "transition")
        const targetType = targetElement.type || (targetElement.tokens !== undefined ? "place" : "transition")

        if (sourceType !== targetType) {
          const newArc = {
            id: `a${Date.now()}`,
            source: connectingFrom.id,
            target: targetElement.id,
            weight: 1,
            isInhibitor: false,
            isReset: false,
          }

          setArcs((prev) => [...prev, newArc])
          netRef.current.addArc(newArc)
        }
      }

      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    },
    [connectingFrom],
  )

  // Supprimer un élément
  const deleteElement = useCallback(
    (elementId, elementType) => {
      if (elementType === "place") {
        setPlaces((prev) => prev.filter((p) => p.id !== elementId))
        netRef.current.removePlace(elementId)
      } else if (elementType === "transition") {
        setTransitions((prev) => prev.filter((t) => t.id !== elementId))
        netRef.current.removeTransition(elementId)
      } else if (elementType === "arc") {
        setArcs((prev) => prev.filter((a) => a.id !== elementId))
        netRef.current.removeArc(elementId)
      }

      // Supprimer les arcs connectés
      setArcs((prev) => prev.filter((a) => a.source !== elementId && a.target !== elementId))
      closeContextMenu()
    },
    [closeContextMenu],
  )

  // Ajouter/enlever des jetons
  const modifyTokens = useCallback(
    (placeId, delta) => {
      setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, tokens: Math.max(0, p.tokens + delta) } : p)))
      closeContextMenu()
    },
    [closeContextMenu],
  )

  // Mise à jour des propriétés depuis le panneau
  const updateElement = useCallback(
    (elementId, updates) => {
      if (selected?.tokens !== undefined) {
        // C'est une place
        setPlaces((prev) => prev.map((p) => (p.id === elementId ? { ...p, ...updates } : p)))
      } else if (selected?.source) {
        // C'est un arc
        setArcs((prev) => prev.map((a) => (a.id === elementId ? { ...a, ...updates } : a)))
      } else {
        // C'est une transition
        setTransitions((prev) => prev.map((t) => (t.id === elementId ? { ...t, ...updates } : t)))
      }
    },
    [selected],
  )

  // Contrôles de simulation
  const playSimulation = useCallback(() => {
    if (!simulationInterval) {
      const interval = setInterval(() => {
        netRef.current.simulateStep(() => {
          setPlaces((prev) =>
            prev.map((p) => ({
              ...p,
              tokens: netRef.current.marking[p.id] || p.tokens,
            })),
          )
        })
      }, 1000)
      setSimulationInterval(interval)
    }
  }, [simulationInterval])

  const pauseSimulation = useCallback(() => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
  }, [simulationInterval])

  const stepSimulation = useCallback(() => {
    netRef.current.simulateStep(() => {
      setPlaces((prev) =>
        prev.map((p) => ({
          ...p,
          tokens: netRef.current.marking[p.id] || p.tokens,
        })),
      )
    })
  }, [])

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false })
      canvas.addEventListener("mousedown", handleMouseDown)
      canvas.addEventListener("mousemove", handleMouseMove)
      canvas.addEventListener("mouseup", handleMouseUp)
      canvas.addEventListener("contextmenu", handleCanvasContextMenu)

      return () => {
        canvas.removeEventListener("wheel", handleWheel)
        canvas.removeEventListener("mousedown", handleMouseDown)
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mouseup", handleMouseUp)
        canvas.removeEventListener("contextmenu", handleCanvasContextMenu)
      }
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleCanvasContextMenu])

  return (
    <div className="petri-editor">
      <div className="editor-header">
        <h1>Éditeur de Réseaux de Petri</h1>
        <div className="header-controls">
          <SimulationControls
            onPlay={playSimulation}
            onPause={pauseSimulation}
            onStep={stepSimulation}
            isPlaying={!!simulationInterval}
          />
        </div>
      </div>

      <div className="editor-content">
        <div ref={canvasRef} className="canvas-container" onClick={closeContextMenu}>
          <div
            className="canvas"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {/* Grille de fond */}
            <div className="grid-background" />

            {/* Arcs */}
            {arcs.map((arc) => {
              const sourceElement =
                places.find((p) => p.id === arc.source) || transitions.find((t) => t.id === arc.source)
              const targetElement =
                places.find((p) => p.id === arc.target) || transitions.find((t) => t.id === arc.target)

              if (sourceElement && targetElement) {
                return (
                  <Arc
                    key={arc.id}
                    arc={arc}
                    source={sourceElement}
                    target={targetElement}
                    onSelect={() => setSelected(arc)}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        visible: true,
                        type: "arc",
                        element: arc,
                      })
                    }}
                    selected={selected?.id === arc.id}
                  />
                )
              }
              return null
            })}

            {/* Arc temporaire pendant la connexion */}
            {tempArc && (
              <svg className="temp-arc">
                <line
                  x1={tempArc.from.x}
                  y1={tempArc.from.y}
                  x2={tempArc.to.x}
                  y2={tempArc.to.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}

            {/* Places */}
            {places.map((place) => (
              <Place
                key={place.id}
                place={place}
                onSelect={() => setSelected(place)}
                onStartConnection={() => startConnection(place)}
                onEndConnection={() => endConnection(place)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setContextMenu({
                    x: event.clientX,
                    y: event.clientY,
                    visible: true,
                    type: "place",
                    element: place,
                  })
                }}
                selected={selected?.id === place.id}
                isConnecting={isConnecting}
              />
            ))}

            {/* Transitions */}
            {transitions.map((transition) => (
              <Transition
                key={transition.id}
                transition={transition}
                onSelect={() => setSelected(transition)}
                onStartConnection={() => startConnection(transition)}
                onEndConnection={() => endConnection(transition)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setContextMenu({
                    x: event.clientX,
                    y: event.clientY,
                    visible: true,
                    type: "transition",
                    element: transition,
                  })
                }}
                selected={selected?.id === transition.id}
                isConnecting={isConnecting}
              />
            ))}
          </div>
        </div>

        <div className="sidebar">
          <PropertiesPanel selected={selected} onUpdate={updateElement} />
        </div>
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        type={contextMenu.type}
        element={contextMenu.element}
        onClose={closeContextMenu}
        onAddPlace={() => addPlace(contextMenu.position)}
        onAddTransition={() => addTransition(contextMenu.position)}
        onDelete={() => {
          const element = contextMenu.element
          if (element) {
            const type = element.tokens !== undefined ? "place" : element.source ? "arc" : "transition"
            deleteElement(element.id, type)
          }
        }}
        onAddTokens={() => modifyTokens(contextMenu.element?.id, 1)}
        onRemoveTokens={() => modifyTokens(contextMenu.element?.id, -1)}
      />
    </div>
  )
}

export default PetriEditor
