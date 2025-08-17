"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Place from "./Place"
import Transition from "./Transition"
import Arc from "./Arc"
import PropertiesPanel from "./PropertiesPanel"
import SimulationControls from "./SimulationControls"
import ContextMenu from "./ContextMenu"
import ThemeSelector from "./ThemeSelector"
import NetworkManager from "./NetworkManager"
import LayerManager from "./LayerManager"
import apiService from "../services/ApiService"
import "./PetriEditor.css"

const PetriEditor = () => {
  const canvasRef = useRef(null)

  const [places, setPlaces] = useState([])
  const [transitions, setTransitions] = useState([])
  const [arcs, setArcs] = useState([])
  const [selected, setSelected] = useState(null)
  const [simulationInterval, setSimulationInterval] = useState(null)
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false, type: null })
  const [isSimulating, setIsSimulating] = useState(false) // Added to track simulation state

  const [selectedTheme, setSelectedTheme] = useState(null)
  const [themeData, setThemeData] = useState(null)
  const [layers, setLayers] = useState([])
  const [currentLayer, setCurrentLayer] = useState("All")
  const [petriNets, setPetriNets] = useState([])
  const [currentPetriNet, setCurrentPetriNet] = useState(null)
  const [validation, setValidation] = useState({ deadlock: false, concurrent: 0, bounded: true })

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [tempArc, setTempArc] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const [draggedElement, setDraggedElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [originalPosition, setOriginalPosition] = useState(null)

  const [firingTransitionId, setFiringTransitionId] = useState(null)
  const [firingArcs, setFiringArcs] = useState([])
  const [notifications, setNotifications] = useState([])

  const handleThemeLoad = useCallback((loadedThemeData) => {
    console.log("[v0] Loading theme data:", loadedThemeData)
    setThemeData(loadedThemeData)
    setLayers(loadedThemeData.layers || [])
    setPetriNets(loadedThemeData.petri_nets || [])

    const allPlaces = loadedThemeData.petri_nets?.flatMap((pn) => pn.places || []) || []
    const allTransitions = loadedThemeData.petri_nets?.flatMap((pn) => pn.transitions || []) || []
    const allArcs = loadedThemeData.petri_nets?.flatMap((pn) => pn.arcs || []) || []

    setPlaces(allPlaces)
    setTransitions(allTransitions)
    setArcs(allArcs)

    if (loadedThemeData.petri_nets && loadedThemeData.petri_nets.length > 0) {
      setCurrentPetriNet(loadedThemeData.petri_nets[0].id)
    }

    setCurrentLayer("All")
    setSelected(null)
    checkValidation()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme")
    const savedPetriNet = localStorage.getItem("currentPetriNet")
    const savedLayer = localStorage.getItem("currentLayer")

    if (savedTheme) {
      const theme = JSON.parse(savedTheme)
      setSelectedTheme(theme)
      apiService
        .getThemeDetail(theme.id)
        .then((response) => {
          setThemeData(response)
          setLayers(response.layers || [])
          setPetriNets(response.petri_nets || [])

          const allPlaces = response.petri_nets?.flatMap((pn) => pn.places || []) || []
          const allTransitions = response.petri_nets?.flatMap((pn) => pn.transitions || []) || []
          const allArcs = response.petri_nets?.flatMap((pn) => pn.arcs || []) || []

          setPlaces(allPlaces)
          setTransitions(allTransitions)
          setArcs(allArcs)
        })
        .catch((err) => {
          console.error("[PetriEditor] Failed to load saved theme:", err)
          setThemeData({ theme, layers: [], petri_nets: [], places: [], transitions: [], arcs: [] })
        })
    }

    if (savedPetriNet) {
      setCurrentPetriNet(Number(savedPetriNet))
    }

    if (savedLayer) {
      setCurrentLayer(savedLayer === "All" ? "All" : Number(savedLayer))
    }
  }, [])

  useEffect(() => {
    if (selectedTheme) {
      localStorage.setItem("selectedTheme", JSON.stringify(selectedTheme))
    } else {
      localStorage.removeItem("selectedTheme")
    }
  }, [selectedTheme])

  useEffect(() => {
    if (currentPetriNet) {
      localStorage.setItem("currentPetriNet", currentPetriNet)
    } else {
      localStorage.removeItem("currentPetriNet")
    }
  }, [currentPetriNet])

  useEffect(() => {
    localStorage.setItem("currentLayer", currentLayer)
  }, [currentLayer])

  const checkValidation = useCallback(() => {
    if (!currentPetriNet || places.length === 0) {
      setValidation({ deadlock: false, concurrent: 0, bounded: true })
      return
    }

    // Check for deadlock - no enabled transitions
    const enabledTransitions = getEnabledTransitions()
    const deadlock = enabledTransitions.length === 0 && transitions.length > 0

    // Count concurrent transitions
    const concurrent = enabledTransitions.length

    // Check boundedness - if any place exceeds capacity or could theoretically grow infinitely
    const bounded = places.every((place) => {
      if (place.capacity && place.tokens > place.capacity) return false
      // Simple heuristic: if tokens > 1000, consider unbounded
      return place.tokens <= 1000
    })

    setValidation({ deadlock, concurrent, bounded })
  }, [currentPetriNet, places, transitions])

  const getEnabledTransitions = useCallback(() => {
    return transitions.filter((transition) => {
      // Get input and output arcs for this transition
      const inputArcs = arcs.filter((arc) => arc.target_id === transition.id_in_net)
      const outputArcs = arcs.filter((arc) => arc.source_id === transition.id_in_net)

      // Check if transition is enabled
      for (const arc of inputArcs) {
        const sourcePlace = places.find((p) => p.id_in_net === arc.source_id)
        if (!sourcePlace) continue

        if (arc.is_inhibitor) {
          // Inhibitor arc: transition disabled if place has tokens
          if (sourcePlace.tokens > 0) return false
        } else {
          // Normal arc: need enough tokens
          if (sourcePlace.tokens < arc.weight) return false
        }
      }

      // Check output places capacity constraints
      for (const arc of outputArcs) {
        const targetPlace = places.find((p) => p.id_in_net === arc.target_id)
        if (!targetPlace) continue

        if (targetPlace.capacity && targetPlace.tokens + arc.weight > targetPlace.capacity) {
          return false
        }
      }

      return true
    })
  }, [arcs, places, transitions])

  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now()
    const notification = { id, message, type }
    setNotifications((prev) => [...prev, notification])

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }, [])

  const fireTransition = useCallback(
    async (transition) => {
      const inputArcs = arcs.filter((arc) => arc.target_id === transition.id_in_net)
      const outputArcs = arcs.filter((arc) => arc.source_id === transition.id_in_net)

      console.log(`[v0] Firing transition: ${transition.label}`)

      setFiringTransitionId(transition.id)
      setFiringArcs([...inputArcs.map((a) => a.id), ...outputArcs.map((a) => a.id)])

      addNotification(`Transition ${transition.label} déclenchée`, "success")

      // Update places based on arc effects
      const updatedPlaces = [...places]

      // Process input arcs (consume tokens)
      for (const arc of inputArcs) {
        const placeIndex = updatedPlaces.findIndex((p) => p.id_in_net === arc.source_id)
        if (placeIndex === -1) continue

        if (arc.is_reset) {
          // Reset arc: remove all tokens
          updatedPlaces[placeIndex] = { ...updatedPlaces[placeIndex], tokens: 0 }
        } else if (!arc.is_inhibitor) {
          // Normal arc: consume tokens
          updatedPlaces[placeIndex] = {
            ...updatedPlaces[placeIndex],
            tokens: Math.max(0, updatedPlaces[placeIndex].tokens - arc.weight),
          }
        }
        // Inhibitor arcs don't consume tokens
      }

      // Process output arcs (produce tokens)
      for (const arc of outputArcs) {
        const placeIndex = updatedPlaces.findIndex((p) => p.id_in_net === arc.target_id)
        if (placeIndex === -1) continue

        const newTokens = updatedPlaces[placeIndex].tokens + arc.weight
        const capacity = updatedPlaces[placeIndex].capacity

        updatedPlaces[placeIndex] = {
          ...updatedPlaces[placeIndex],
          tokens: capacity ? Math.min(newTokens, capacity) : newTokens,
        }
      }

      // Update state with new token counts
      setPlaces((prevPlaces) =>
        prevPlaces.map((place) => {
          const updated = updatedPlaces.find((up) => up.id === place.id)
          return updated || place
        }),
      )

      // Update backend for each modified place
      for (const updatedPlace of updatedPlaces) {
        const originalPlace = places.find((p) => p.id === updatedPlace.id)
        if (originalPlace && originalPlace.tokens !== updatedPlace.tokens) {
          try {
            await apiService.updatePlace(updatedPlace.id, { tokens: updatedPlace.tokens })
          } catch (err) {
            console.error(`[v0] Failed to update place ${updatedPlace.label}:`, err)
          }
        }
      }

      setTimeout(() => {
        setFiringTransitionId(null)
        setFiringArcs([])
      }, 500)

      checkValidation()
    },
    [arcs, places, checkValidation, addNotification],
  )

  const playSimulation = useCallback(() => {
    // Clear any existing interval first
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }

    const interval = setInterval(() => {
      const enabledTransitions = getEnabledTransitions()

      if (enabledTransitions.length === 0) {
        console.log("[v0] No enabled transitions - stopping simulation")
        addNotification("Simulation terminée : aucune transition activable", "info")
        clearInterval(interval)
        setSimulationInterval(null)
        setIsSimulating(false) // Added to stop simulation state
        return
      }

      // Randomly select an enabled transition to fire
      const randomIndex = Math.floor(Math.random() * enabledTransitions.length)
      const selectedTransition = enabledTransitions[randomIndex]

      fireTransition(selectedTransition)
    }, 1000)

    setSimulationInterval(interval)
    setIsSimulating(true) // Added to track simulation state
    addNotification("Simulation démarrée", "info")
    console.log("[v0] Simulation started")
  }, [getEnabledTransitions, fireTransition, simulationInterval, addNotification])

  const pauseSimulation = useCallback(() => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
    setIsSimulating(false)
    addNotification("Simulation en pause", "info")
    console.log("[v0] Simulation paused")
  }, [simulationInterval, addNotification])

  const stepSimulation = useCallback(() => {
    const enabledTransitions = getEnabledTransitions()

    if (enabledTransitions.length === 0) {
      console.warn("[v0] No enabled transitions available for step")
      addNotification("Aucune transition activée disponible", "warning")
      return
    }

    // Fire the first enabled transition (or could be random)
    const transitionToFire = enabledTransitions[0]
    fireTransition(transitionToFire)
  }, [getEnabledTransitions, fireTransition, addNotification])

  const exportJSON = useCallback(async () => {
    const data = {
      petri_net: currentPetriNet,
      places,
      transitions,
      arcs,
    }
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "petri-net.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [places, transitions, arcs, currentPetriNet])

  const exportPNG = useCallback(async () => {
    if (typeof window !== "undefined" && canvasRef.current) {
      try {
        const html2canvas = (await import("html2canvas")).default
        const canvas = await html2canvas(canvasRef.current)
        const url = canvas.toDataURL("image/png")
        const a = document.createElement("a")
        a.href = url
        a.download = "petri-net.png"
        a.click()
      } catch (error) {
        console.error("Export PNG failed:", error)
        alert("Export PNG nécessite l'installation de html2canvas")
      }
    }
  }, [])

  const duplicateElement = useCallback(
    async (id, type) => {
      const element = type === "place" ? places.find((p) => p.id === id) : transitions.find((t) => t.id === id)
      if (element) {
        const newElement = {
          ...element,
          id_in_net: `${type[0]}${Date.now()}`,
          position: { x: element.position.x + 50, y: element.position.y + 50 },
          label: `${element.label} (copie)`,
          petri_net: currentPetriNet,
        }
        try {
          let createdElement
          if (type === "place") {
            createdElement = await apiService.createPlace(newElement)
            setPlaces((prev) => [...prev, createdElement])
          } else {
            createdElement = await apiService.createTransition(newElement)
            setTransitions((prev) => [...prev, createdElement])
          }
        } catch (err) {
          console.error(`Erreur lors de la duplication de ${type}:`, err)
        }
      }
    },
    [places, transitions, currentPetriNet],
  )

  const filteredPlaces = places.filter(
    (p) => p.petri_net === currentPetriNet && (currentLayer === "All" || p.layer === currentLayer),
  )
  const filteredTransitions = transitions.filter(
    (t) => t.petri_net === currentPetriNet && (currentLayer === "All" || t.layer === currentLayer),
  )
  const filteredArcs = arcs.filter((arc) => {
    const source =
      places.find((p) => p.id_in_net === arc.source_id) || transitions.find((t) => t.id_in_net === arc.source_id)
    const target =
      places.find((p) => p.id_in_net === arc.target_id) || transitions.find((t) => t.id_in_net === arc.target_id)
    return (
      arc.petri_net === currentPetriNet &&
      (currentLayer === "All" || (source?.layer === currentLayer && target?.layer === currentLayer))
    )
  })

  const handleCanvasContextMenu = useCallback(
    (event) => {
      event.preventDefault()
      if (!event.target.closest(".petri-element")) {
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
      }
    },
    [transform],
  )

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
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - transform.x) / transform.scale
      const y = (event.clientY - rect.top - transform.y) / transform.scale

      setMousePosition({ x, y })

      if (isDragging) {
        setTransform((prev) => ({
          ...prev,
          x: event.clientX - dragStart.x,
          y: event.clientY - dragStart.y,
        }))
      }

      if (draggedElement) {
        const newPosition = {
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        }

        setDraggedElement({ ...draggedElement, position: newPosition })
      }

      if (isConnecting && connectingFrom) {
        setTempArc({
          from: connectingFrom.position,
          to: { x, y },
        })
      }
    },
    [isDragging, dragStart, isConnecting, connectingFrom, transform, draggedElement, dragOffset],
  )

  const handleMouseUp = useCallback(async () => {
    setIsDragging(false)

    if (draggedElement && originalPosition) {
      try {
        const type = draggedElement.tokens !== undefined ? "place" : "transition"
        let updatedElement

        if (type === "place") {
          updatedElement = await apiService.updatePlace(draggedElement.id, { position: draggedElement.position })
          setPlaces((prev) => prev.map((p) => (p.id === draggedElement.id ? updatedElement : p)))
        } else {
          updatedElement = await apiService.updateTransition(draggedElement.id, { position: draggedElement.position })
          setTransitions((prev) => prev.map((t) => (t.id === draggedElement.id ? updatedElement : t)))
        }

        console.log("[v0] Position updated successfully:", updatedElement)
      } catch (err) {
        console.error("Erreur lors de la mise à jour de la position:", err)

        const type = draggedElement.tokens !== undefined ? "place" : "transition"
        if (type === "place") {
          setPlaces((prev) => prev.map((p) => (p.id === draggedElement.id ? { ...p, position: originalPosition } : p)))
        } else {
          setTransitions((prev) =>
            prev.map((t) => (t.id === draggedElement.id ? { ...t, position: originalPosition } : t)),
          )
        }

        alert("Erreur lors de la sauvegarde de la position. La position a été restaurée.")
      }
    }

    setDraggedElement(null)
    setOriginalPosition(null)

    if (isConnecting && !event.target?.closest(".petri-element")) {
      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    }
  }, [isConnecting, draggedElement, originalPosition])

  const startArcCreation = useCallback((element) => {
    setIsConnecting(true)
    setConnectingFrom(element)
  }, [])

  const finishArcCreation = useCallback(
    async (targetElement) => {
      if (connectingFrom && targetElement && connectingFrom.id !== targetElement.id) {
        const sourceType = connectingFrom.tokens !== undefined ? "place" : "transition"
        const targetType = targetElement.tokens !== undefined ? "place" : "transition"

        if (sourceType !== targetType) {
          const existingArc = arcs.find(
            (arc) =>
              (arc.source_id === connectingFrom.id_in_net && arc.target_id === targetElement.id_in_net) ||
              (arc.source_id === targetElement.id_in_net && arc.target_id === connectingFrom.id_in_net),
          )

          if (!existingArc) {
            const newArc = {
              petri_net: currentPetriNet,
              id_in_net: `a${Date.now()}`,
              source_id: connectingFrom.id_in_net,
              target_id: targetElement.id_in_net,
              weight: 1,
              is_inhibitor: false,
              is_reset: false,
            }

            try {
              const createdArc = await apiService.createArc(newArc)
              setArcs((prev) => [...prev, createdArc])
            } catch (err) {
              console.error("Erreur lors de la création de l'arc:", err)
            }
          }
        }
      }

      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    },
    [connectingFrom, arcs, currentPetriNet],
  )

  const handleElementLeftClick = useCallback(
    (element) => {
      if (isConnecting && connectingFrom && connectingFrom.id !== element.id) {
        finishArcCreation(element)
      } else if (!isConnecting) {
        startArcCreation(element)
      }
    },
    [isConnecting, connectingFrom, startArcCreation, finishArcCreation],
  )

  const startElementLeftClick = useCallback(
    (element, event) => {
      event.stopPropagation()
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - transform.x) / transform.scale
      const y = (event.clientY - rect.top - transform.y) / transform.scale

      setOriginalPosition({ ...element.position })
      setDraggedElement(element)
      setDragOffset({
        x: x - element.position.x,
        y: y - element.position.y,
      })
    },
    [transform],
  )

  const handleElementLeftUp = useCallback((element) => {
    setDraggedElement(null)
  }, [])

  const handleElementRightClick = useCallback((element, event) => {
    event.preventDefault()
    setSelected(element)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true,
      type: element.tokens !== undefined ? "place" : "transition",
      element,
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  const addPlace = useCallback(
    async (position) => {
      const newPlace = {
        petri_net: currentPetriNet,
        id_in_net: `p${Date.now()}`,
        label: `Place ${places.length + 1}`,
        position,
        tokens: 0,
        capacity: null,
        token_color: "#000000",
      }
      try {
        const createdPlace = await apiService.createPlace(newPlace)
        setPlaces((prev) => [...prev, createdPlace])
        checkValidation()
      } catch (err) {
        console.error("Erreur lors de l'ajout de la place:", err)
      }
    },
    [places.length, currentPetriNet, checkValidation],
  )

  const addTransition = useCallback(
    async (position) => {
      const newTransition = {
        petri_net: currentPetriNet,
        id_in_net: `t${Date.now()}`,
        label: `Transition ${transitions.length + 1}`,
        position,
        type: "immediate",
        delay_mean: 1.0,
        priority: 1,
        orientation: "portrait",
        layer: currentLayer !== "All" ? currentLayer : null,
      }
      try {
        const createdTransition = await apiService.createTransition(newTransition)
        setTransitions((prev) => [...prev, createdTransition])
        checkValidation()
      } catch (err) {
        console.error("Erreur lors de l'ajout de la transition:", err)
      }
    },
    [transitions.length, currentPetriNet, currentLayer, checkValidation],
  )

  const deleteElement = useCallback(
    async (id, type) => {
      try {
        if (type === "place") {
          await apiService.deletePlace(id)
          setPlaces((prev) => prev.filter((p) => p.id !== id))
          setArcs((prev) => prev.filter((a) => a.source_id !== id && a.target_id !== id))
        } else if (type === "transition") {
          await apiService.deleteTransition(id)
          setTransitions((prev) => prev.filter((t) => t.id !== id))
          setArcs((prev) => prev.filter((a) => a.source_id !== id && a.target_id !== id))
        } else if (type === "arc") {
          await apiService.deleteArc(id)
          setArcs((prev) => prev.filter((a) => a.id !== id))
        }
        checkValidation()
      } catch (err) {
        console.error(`Erreur lors de la suppression de ${type}:`, err)
      }
    },
    [checkValidation],
  )

  const modifyTokens = useCallback(
    async (id, amount) => {
      try {
        const place = places.find((p) => p.id === id)
        const newTokens = Math.max(0, place.tokens + amount)
        const response = await apiService.updatePlace(id, { tokens: newTokens })
        const updatedPlace = await response.json()
        setPlaces((prev) => prev.map((p) => (p.id === id ? updatedPlace : p)))
      } catch (err) {
        console.error("Erreur lors de la modification des jetons:", err)
      }
    },
    [places],
  )

  const updateElement = useCallback(
    async (id, updates) => {
      try {
        const type = places.find((p) => p.id === id)
          ? "place"
          : transitions.find((t) => t.id === id)
            ? "transition"
            : "arc"

        let updatedElement
        if (type === "place") {
          updatedElement = await apiService.updatePlace(id, updates)
          setPlaces((prev) => prev.map((p) => (p.id === id ? updatedElement : p)))
        } else if (type === "transition") {
          updatedElement = await apiService.updateTransition(id, updates)
          setTransitions((prev) => prev.map((t) => (t.id === id ? updatedElement : t)))
        } else {
          updatedElement = await apiService.updateArc(id, updates)
          setArcs((prev) => prev.map((a) => (a.id === id ? updatedElement : a)))
        }
        checkValidation()
      } catch (err) {
        console.error(`Erreur lors de la mise à jour de l'élément:`, err)
        alert("Erreur lors de la sauvegarde des modifications.")
      }
    },
    [places, transitions, arcs, checkValidation],
  )

  const createNetwork = useCallback(async (networkData) => {
    try {
      const createdNetwork = await apiService.createPetriNet(networkData)
      setPetriNets((prev) => [...prev, createdNetwork])
      setCurrentPetriNet(createdNetwork.id)
    } catch (err) {
      console.error("Erreur lors de la création du réseau:", err)
    }
  }, [])

  const deleteNetwork = useCallback(
    async (networkId) => {
      try {
        await apiService.deletePetriNet(networkId)
        setPetriNets((prev) => prev.filter((n) => n.id !== networkId))
        if (currentPetriNet === networkId) {
          const remaining = petriNets.filter((n) => n.id !== networkId)
          setCurrentPetriNet(remaining.length > 0 ? remaining[0].id : null)
        }
      } catch (err) {
        console.error("Erreur lors de la suppression du réseau:", err)
      }
    },
    [currentPetriNet, petriNets],
  )

  const createLayer = useCallback(async (layerData) => {
    try {
      const createdLayer = await apiService.createLayer(layerData)
      setLayers((prev) => [...prev, createdLayer])
    } catch (err) {
      console.error("Erreur lors de la création de la couche:", err)
    }
  }, [])

  const deleteLayer = useCallback(
    async (layerId) => {
      try {
        await apiService.deleteLayer(layerId)
        setLayers((prev) => prev.filter((l) => l.id !== layerId))
        if (currentLayer === layerId) {
          setCurrentLayer("All")
        }
      } catch (err) {
        console.error("Erreur lors de la suppression de la couche:", err)
      }
    },
    [currentLayer],
  )

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

  useEffect(() => {
    checkValidation()
  }, [places, transitions, arcs, checkValidation])

  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval)
        console.log("[v0] Cleaned up simulation interval on component unmount")
      }
    }
  }, [simulationInterval])

  return (
    <div className="petri-editor">
      <div className="notifications">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>

      <ThemeSelector selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} onThemeLoad={handleThemeLoad} />

      <NetworkManager
        petriNets={petriNets}
        currentPetriNet={currentPetriNet}
        onNetworkSelect={setCurrentPetriNet}
        onNetworkCreate={createNetwork}
        onNetworkDelete={deleteNetwork}
        selectedTheme={selectedTheme}
      />

      <LayerManager
        layers={layers}
        currentLayer={currentLayer}
        onLayerSelect={setCurrentLayer}
        onLayerCreate={createLayer}
        onLayerDelete={deleteLayer}
        selectedTheme={selectedTheme}
      />

      <div className="editor-header">
        <h1>Éditeur de Réseaux de Petri</h1>
        <div className="header-controls" style={{ display: "flex", alignItems: "center" }}>
          <button onClick={checkValidation} className="validate-button">
            Valider
          </button>
          <button onClick={exportJSON} className="export-button">
            Export JSON
          </button>
          <button onClick={exportPNG} className="export-button">
            Export PNG
          </button>
          <SimulationControls
            onPlay={playSimulation}
            onPause={pauseSimulation}
            onStep={stepSimulation}
            isPlaying={isSimulating}
          />
        </div>
      </div>

      {(validation.deadlock || validation.concurrent > 0 || !validation.bounded) && (
        <div className="validation-status">
          {validation.deadlock && <div className="validation-error">⚠️ Deadlock détecté</div>}
          {validation.concurrent > 0 && (
            <div className="validation-info">🔄 Concurrence: {validation.concurrent} transitions</div>
          )}
          {!validation.bounded && <div className="validation-warning">📊 Réseau non borné</div>}
        </div>
      )}

      <div className="editor-content">
        <div ref={canvasRef} className="canvas-container" onClick={closeContextMenu}>
          <div
            className="canvas"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
              transition: "transform 0.2s ease", // Add smooth transform transitions
            }}
          >
            <div className="grid-background" />
            {filteredArcs.map((arc) => {
              const sourceElement =
                places.find((p) => p.id_in_net === arc.source_id) ||
                transitions.find((t) => t.id_in_net === arc.source_id)
              const targetElement =
                places.find((p) => p.id_in_net === arc.target_id) ||
                transitions.find((t) => t.id_in_net === arc.target_id)

              if (sourceElement && targetElement) {
                return (
                  <Arc
                    key={arc.id}
                    arc={arc}
                    source={sourceElement}
                    target={targetElement}
                    places={places}
                    transitions={transitions}
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
                    onUpdate={updateElement}
                    selected={selected?.id === arc.id}
                    isFiring={firingArcs.includes(arc.id)}
                    onDelete={() => {
                      const element = arc;
                      if (element) {
                        deleteElement(element.id, "arc")
                      }
                    }}
                  />
                )
              }
              return null
            })}

            {tempArc && (
              <svg
                className="temp-arc"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
              >
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

            {filteredPlaces.map((place) => {
              const enabledTransitions = getEnabledTransitions()
              const isInvolvedInTransition = enabledTransitions.some((t) =>
                arcs.some(
                  (arc) =>
                    (arc.source_id === place.id_in_net && arc.target_id === t.id_in_net) ||
                    (arc.source_id === t.id_in_net && arc.target_id === place.id_in_net),
                ),
              )

              return (
                <Place
                  key={place.id}
                  place={place}
                  onLeftMouseDown={(event) => startElementLeftClick(place, event)}
                  onLeftMouseUp={() => handleElementLeftUp(place)}
                  onRightClick={(event) => handleElementRightClick(place, event)}
                  onLeftClick={() => handleElementLeftClick(place)}
                  selected={selected?.id === place.id}
                  isConnecting={isConnecting}
                  isDragged={draggedElement?.id === place.id}
                  isActive={isInvolvedInTransition} // Pass active state
                  isFull={place.capacity && place.tokens >= place.capacity} // Pass full state
                />
              )
            })}

            {filteredTransitions.map((transition) => {
              const enabledTransitions = getEnabledTransitions()
              const isEnabled = enabledTransitions.some((t) => t.id === transition.id)

              return (
                <Transition
                  key={transition.id}
                  transition={transition}
                  onLeftMouseDown={(event) => startElementLeftClick(transition, event)}
                  onLeftMouseUp={() => handleElementLeftUp(transition)}
                  onRightClick={(event) => handleElementRightClick(transition, event)}
                  onLeftClick={() => handleElementLeftClick(transition)}
                  selected={selected?.id === transition.id}
                  isConnecting={isConnecting}
                  isDragged={draggedElement?.id === transition.id}
                  isEnabled={isEnabled} // Pass enabled state
                  isFiring={firingTransitionId === transition.id} // Pass firing state
                />
              )
            })}
          </div>
        </div>

        <div className="sidebar">
          <PropertiesPanel
            selected={selected}
            onUpdate={updateElement}
            onDelete={(id, type) => {
              deleteElement(id, type)
              setSelected(null)
            }}
            onDuplicate={duplicateElement}
            validation={validation} // Pass validation state to properties panel
          />
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
          if (element && contextMenu.type === "arc") {
            deleteElement(element.id, "arc")
          }
        }}
        onDuplicate={() => {
          const element = contextMenu.element
          if (element) {
            const type = element.tokens !== undefined ? "place" : "transition"
            duplicateElement(element.id, type)
          }
        }}
      />
    </div>
  )
}

export default PetriEditor
