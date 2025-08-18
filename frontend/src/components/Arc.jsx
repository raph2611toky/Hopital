"use client"

import { useState, useEffect, useRef } from "react"
import "./Arc.css"

const Arc = ({
  arc,
  source,
  target,
  places,
  transitions,
  onSelect,
  onContextMenu,
  selected,
  onUpdate,
  onDelete,
  onArcDragStart,
  onArcDragEnd,
  canBeInhibitor,
}) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false)
  const [tempWeight, setTempWeight] = useState(arc.weight)
  const [controlPoints, setControlPoints] = useState(arc.control_points || [])
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(-1)
  const [showControlPoints, setShowControlPoints] = useState(false)
  const svgRef = useRef(null)
  const arcDragId = useRef(`arc-${arc.id}-${Date.now()}`)
  const [isSourceTransition, setIsSourceTransition] = useState(false) // Declare isSourceTransition variable
  const [pathData, setPathData] = useState({
    path: "",
    midPoint: { x: 0, y: 0 },
    isCurved: false,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
  })

  useEffect(() => {
    setTempWeight(arc.weight)
  }, [arc.weight])

  useEffect(() => {
    setControlPoints(arc.control_points || [])
  }, [arc.control_points])

  useEffect(() => {
    // Check if source is a transition and update isSourceTransition state
    setIsSourceTransition(transitions.some((transition) => transition.id === source.id))
  }, [source, transitions])

  const calculateDirectionPosition = (element, direction, isSource = true) => {
    const isPlace = places.some((place) => place.id === element.id)
    const radius = isPlace ? 30 : 0

    if (isPlace) {
      switch (direction) {
        case "HAUT":
          return { x: element.position.x, y: element.position.y - radius }
        case "GAUCHE":
          return { x: element.position.x - radius, y: element.position.y }
        case "DROITE":
          return { x: element.position.x + radius, y: element.position.y }
        case "BAS":
        default:
          return { x: element.position.x, y: element.position.y + radius }
      }
    } else {
      const transition = transitions.find((t) => t.id === element.id)
      const isLandscape = transition?.orientation === "landscape"
      const halfWidth = isLandscape ? 20 : 10 // Reduced from 25/15 to 20/10
      const halfHeight = isLandscape ? 10 : 20 // Reduced from 15/25 to 10/20

      switch (direction) {
        case "HAUT":
          return { x: element.position.x, y: element.position.y - halfHeight }
        case "GAUCHE":
          return { x: element.position.x - halfWidth, y: element.position.y }
        case "DROITE":
          return { x: element.position.x + halfWidth, y: element.position.y }
        case "BAS":
        default:
          return { x: element.position.x, y: element.position.y + halfHeight }
      }
    }
  }

  const calculateRectangularPath = (start, end, controlPoints) => {
    const dx = Math.abs(end.x - start.x)
    const dy = Math.abs(end.y - start.y)
    const tolerance = 2 // pixels

    // If perfectly aligned, return straight line
    if (dx <= tolerance || dy <= tolerance) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }

    if (!controlPoints || controlPoints.length === 0) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }

    const radius = 10 // Radius for rounded corners
    const exitDistance = 15 // Distance to travel before turning
    let path = `M ${start.x} ${start.y}`

    // Determine if we need rectangular routing based on distance and control points
    const shouldUseRectangular = dx > 50 || dy > 50 || controlPoints.length > 0

    if (shouldUseRectangular && controlPoints.length > 0) {
      const cp1 = controlPoints[0]

      // Create rectangular path with rounded corners
      if (controlPoints.length === 1) {
        const midX = cp1.x
        const midY = cp1.y

        // Determine primary direction based on which coordinate changed more from start
        const deltaX = Math.abs(midX - start.x)
        const deltaY = Math.abs(midY - start.y)
        const goHorizontalFirst = deltaX > deltaY

        if (goHorizontalFirst) {
          // Go horizontal first, then vertical - only horizontal segment stretches
          const exitX = start.x + Math.sign(midX - start.x) * exitDistance
          const fixedCornerY = start.y // Keep Y coordinate fixed at start level
          const stretchedCornerX = midX // Only X stretches to control point

          path += ` L ${exitX} ${fixedCornerY}` // Exit horizontally first

          if (Math.abs(stretchedCornerX - exitX) > radius && Math.abs(end.y - fixedCornerY) > radius) {
            path += ` L ${stretchedCornerX - Math.sign(stretchedCornerX - exitX) * radius} ${fixedCornerY}`
            path += ` A ${radius} ${radius} 0 0 ${stretchedCornerX > exitX && end.y > fixedCornerY ? 1 : 0} ${stretchedCornerX} ${fixedCornerY + Math.sign(end.y - fixedCornerY) * radius}`
            path += ` L ${stretchedCornerX} ${end.y - Math.sign(end.y - fixedCornerY) * radius}`
            path += ` A ${radius} ${radius} 0 0 ${stretchedCornerX > end.x && end.y > fixedCornerY ? 0 : 1} ${stretchedCornerX + Math.sign(end.x - stretchedCornerX) * radius} ${end.y}`
            path += ` L ${end.x} ${end.y}`
          } else {
            path += ` L ${stretchedCornerX} ${fixedCornerY} L ${end.x} ${end.y}`
          }
        } else {
          // Go vertical first, then horizontal - only vertical segment stretches
          const exitY = start.y + Math.sign(midY - start.y) * exitDistance
          const fixedCornerX = start.x // Keep X coordinate fixed at start level
          const stretchedCornerY = midY // Only Y stretches to control point

          path += ` L ${fixedCornerX} ${exitY}` // Exit vertically first

          if (Math.abs(stretchedCornerY - exitY) > radius && Math.abs(end.x - fixedCornerX) > radius) {
            path += ` L ${fixedCornerX} ${stretchedCornerY - Math.sign(stretchedCornerY - exitY) * radius}`
            path += ` A ${radius} ${radius} 0 0 ${end.x > fixedCornerX && stretchedCornerY > exitY ? 1 : 0} ${fixedCornerX + Math.sign(end.x - fixedCornerX) * radius} ${stretchedCornerY}`
            path += ` L ${end.x - Math.sign(end.x - fixedCornerX) * radius} ${stretchedCornerY}`
            path += ` A ${radius} ${radius} 0 0 ${end.x > fixedCornerX && end.y > stretchedCornerY ? 1 : 0} ${end.x} ${stretchedCornerY + Math.sign(end.y - stretchedCornerY) * radius}`
            path += ` L ${end.x} ${end.y}`
          } else {
            path += ` L ${fixedCornerX} ${stretchedCornerY} L ${end.x} ${end.y}`
          }
        }
      } else if (controlPoints.length >= 2) {
        // Multiple control points - create path with rounded corners at each point
        let prevPoint = start

        const firstCP = controlPoints[0]
        const initialDirection = {
          x: firstCP.x - start.x,
          y: firstCP.y - start.y,
        }
        const initialMagnitude = Math.sqrt(
          initialDirection.x * initialDirection.x + initialDirection.y * initialDirection.y,
        )
        if (initialMagnitude > 0) {
          const normalizedX = initialDirection.x / initialMagnitude
          const normalizedY = initialDirection.y / initialMagnitude
          const exitPoint = {
            x: start.x + normalizedX * exitDistance,
            y: start.y + normalizedY * exitDistance,
          }
          path += ` L ${exitPoint.x} ${exitPoint.y}`
          prevPoint = exitPoint
        }

        for (let i = 0; i < controlPoints.length; i++) {
          const currentPoint = controlPoints[i]
          const nextPoint = i < controlPoints.length - 1 ? controlPoints[i + 1] : end

          // Calculate direction to current point
          const toCurrent = {
            x: currentPoint.x - prevPoint.x,
            y: currentPoint.y - prevPoint.y,
          }

          // Calculate direction from current point
          const fromCurrent = {
            x: nextPoint.x - currentPoint.x,
            y: nextPoint.y - currentPoint.y,
          }

          // Add line to approach the corner
          const approachDistance = Math.min(radius, Math.abs(toCurrent.x) / 2, Math.abs(toCurrent.y) / 2)
          const approachX = currentPoint.x - Math.sign(toCurrent.x) * approachDistance
          const approachY = currentPoint.y - Math.sign(toCurrent.y) * approachDistance

          path += ` L ${approachX} ${approachY}`

          // Add rounded corner
          const exitDistance = Math.min(radius, Math.abs(fromCurrent.x) / 2, Math.abs(fromCurrent.y) / 2)
          const exitX = currentPoint.x + Math.sign(fromCurrent.x) * exitDistance
          const exitY = currentPoint.y + Math.sign(fromCurrent.y) * exitDistance

          if (approachDistance > 0 && exitDistance > 0) {
            const sweep = toCurrent.x * fromCurrent.y - toCurrent.y * fromCurrent.x > 0 ? 1 : 0
            path += ` A ${radius} ${radius} 0 0 ${sweep} ${exitX} ${exitY}`
          } else {
            path += ` L ${currentPoint.x} ${currentPoint.y}`
          }

          prevPoint = currentPoint
        }

        path += ` L ${end.x} ${end.y}`
      }
    } else {
      // Fallback to simple line
      path += ` L ${end.x} ${end.y}`
    }

    return path
  }

  const calculatePath = () => {
    const arcMode = arc.mode || "CURVILIGNE" // Default to CURVILIGNE if mode not specified

    if (arcMode === "RECTANGULAIRE") {
      const isSourceTransition = transitions.some((transition) => transition.id === source.id)
      const isTargetTransition = transitions.some((transition) => transition.id === target.id)

      const sourceDirection = isSourceTransition ? "BAS" : arc.source_direction || "BAS"
      const targetDirection = isTargetTransition ? "HAUT" : "HAUT"

      const start = calculateDirectionPosition(source, sourceDirection, true)
      const end = calculateDirectionPosition(target, targetDirection, false)

      const rectangularPath = calculateRectangularPath(start, end, controlPoints)

      const pathLength = calculatePathLength(rectangularPath)
      const midPoint = getPointAtDistance(rectangularPath, pathLength / 2)

      return {
        path: rectangularPath,
        midPoint: midPoint || { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        isCurved: controlPoints && controlPoints.length > 0,
        start,
        end,
      }
    } else {
      // Use original curviligne implementation
      return calculateCurvedPath()
    }
  }

  const calculateCurvedPath = () => {
    const isSourceTransition = transitions.some((transition) => transition.id === source.id)
    const isTargetTransition = transitions.some((transition) => transition.id === target.id)

    // For transitions: force BAS (bottom) for outgoing arcs, HAUT (top) for incoming arcs
    const sourceDirection = isSourceTransition ? "BAS" : arc.source_direction || "BAS"
    const targetDirection = isTargetTransition ? "HAUT" : "HAUT"

    let start = calculateDirectionPosition(source, sourceDirection, true)
    const end = calculateDirectionPosition(target, targetDirection, false)

    const isSourcePlace = places.some((place) => place.id === source.id)

    if (isSourcePlace) {
      const radius = 30
      start = {
        x: source.position.x,
        y: source.position.y,
      }
    } else if (isSourceTransition) {
      const sourceTransition = transitions.find((t) => t.id === source.id)
      const isLandscape = sourceTransition?.orientation === "landscape"
      const halfWidth = isLandscape ? 25 : 15
      const halfHeight = isLandscape ? 15 : 25
      const tX = halfWidth / Math.abs(start.x - source.position.x || 1)
      const tY = halfHeight / Math.abs(start.y - source.position.y || 1)
      const t = Math.min(tX, tY)
      const intersectionX = (start.x - source.position.x) * t
      const intersectionY = (start.y - source.position.y) * t
      const magnitude = Math.sqrt(intersectionX * intersectionX + intersectionY * intersectionY)
      const scale = magnitude > 0 ? (halfWidth * halfHeight) / magnitude : 1
      start = {
        x: source.position.x + (intersectionX / magnitude) * scale * (start.x > source.position.x ? 1 : -1),
        y: source.position.y + (intersectionY / magnitude) * scale * (start.y > source.position.y ? 1 : -1),
      }
    }

    if (controlPoints && controlPoints.length > 0) {
      let path = `M ${start.x} ${start.y}`
      let midPoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }

      if (controlPoints.length === 1) {
        const cp = controlPoints[0]
        path += ` Q ${cp.x} ${cp.y}, ${end.x} ${end.y}`
        midPoint = {
          x: 0.25 * start.x + 0.5 * cp.x + 0.25 * end.x,
          y: 0.25 * start.y + 0.5 * cp.y + 0.25 * end.y,
        }
      } else if (controlPoints.length === 2) {
        const cp1 = controlPoints[0]
        const cp2 = controlPoints[1]
        path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`
        midPoint = {
          x: (start.x + cp1.x + cp2.x + end.x) / 4,
          y: (start.y + cp1.y + cp2.y + end.y) / 4,
        }
      } else if (controlPoints.length === 3) {
        const cp1 = controlPoints[0]
        const cp2 = controlPoints[1]
        const cp3 = controlPoints[2]
        path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${cp3.x} ${cp3.y}`
        path += ` S ${cp3.x} ${cp3.y}, ${end.x} ${end.y}`
        midPoint = {
          x: (start.x + cp1.x + cp2.x + cp3.x + end.x) / 5,
          y: (start.y + cp1.y + cp2.y + cp3.y + end.y) / 5,
        }
      }

      return {
        path,
        midPoint,
        isCurved: true,
        start,
        end,
      }
    }

    const obstacles = [...places, ...transitions].filter(
      (element) => element.id !== source.id && element.id !== target.id,
    )

    let hasObstacle = false
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2

    obstacles.forEach((obstacle) => {
      const distToLine =
        Math.abs(
          (end.y - start.y) * obstacle.position.x -
            (end.x - start.x) * obstacle.position.y +
            end.x * start.y -
            end.y * start.x,
        ) / Math.sqrt(Math.pow(end.y - start.y, 2) + Math.pow(end.x - start.x, 2))

      if (distToLine < 50) {
        hasObstacle = true
      }
    })

    if (hasObstacle) {
      const dxCurved = end.x - start.x
      const dyCurved = end.y - start.y
      const distanceCurved = Math.sqrt(dxCurved * dxCurved + dyCurved * dyCurved)
      const controlOffset = Math.min(distanceCurved * 0.35, 80)
      const perpX = (-dyCurved / distanceCurved) * controlOffset
      const perpY = (dxCurved / distanceCurved) * controlOffset
      const angle = Math.atan2(dyCurved, dxCurved)
      const offsetMultiplier = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))
      const controlX1 = start.x + dxCurved * 0.25 + perpX * 0.5 * offsetMultiplier
      const controlY1 = start.y + dyCurved * 0.25 + perpY * 0.5 * offsetMultiplier
      const controlX2 = start.x + dxCurved * 0.75 + perpX * 0.5 * offsetMultiplier
      const controlY2 = start.y + dyCurved * 0.75 + perpY * 0.5 * offsetMultiplier

      return {
        path: `M ${start.x} ${start.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${end.x} ${end.y}`,
        midPoint: {
          x: (start.x + controlX1 + controlX2 + end.x) / 4,
          y: (start.y + controlY1 + controlY2 + end.y) / 4,
        },
        isCurved: true,
        start,
        end,
      }
    } else {
      return {
        path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        midPoint: { x: midX, y: midY },
        isCurved: false,
        start,
        end,
      }
    }
  }

  const getFixedControlPointPosition = (index, totalPoints) => {
    const positions = [0.25, 0.5, 0.75]
    const t = positions[index] || 0.5

    return {
      x: pathData.start.x + (pathData.end.x - pathData.start.x) * t,
      y: pathData.start.y + (pathData.end.y - pathData.start.y) * t,
    }
  }

  const adjustAdjacentPoints = (draggedIndex, newPosition) => {
    const newControlPoints = [...controlPoints]
    newControlPoints[draggedIndex] = newPosition

    if (draggedIndex > 0) {
      const prevPoint = newControlPoints[draggedIndex - 1]
      const influence = 0.3
      newControlPoints[draggedIndex - 1] = {
        x: prevPoint.x + (newPosition.x - prevPoint.x) * influence,
        y: prevPoint.y + (newPosition.y - prevPoint.y) * influence,
      }
    }

    if (draggedIndex < newControlPoints.length - 1) {
      const nextPoint = newControlPoints[draggedIndex + 1]
      const influence = 0.3
      newControlPoints[draggedIndex + 1] = {
        x: nextPoint.x + (newPosition.x - nextPoint.x) * influence,
        y: nextPoint.y + (newPosition.y - nextPoint.y) * influence,
      }
    }

    return newControlPoints
  }

  const handleMouseDown = (event, index = -1) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    if (onArcDragStart) {
      onArcDragStart()
    }

    if (index === -1) {
      const pointOnPath = getPointOnPath(event)
      const newControlPoints = [...controlPoints, { x: pointOnPath.x, y: pointOnPath.y }]
      setControlPoints(newControlPoints)
      setDragIndex(newControlPoints.length - 1)
    } else {
      setDragIndex(index)
    }

    setIsDragging(true)
    setShowControlPoints(true)
  }

  const handleMouseMove = (event) => {
    if (!isDragging || dragIndex === -1) return

    event.stopPropagation()

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newPosition = { x, y }
    const adjustedPoints = adjustAdjacentPoints(dragIndex, newPosition)
    setControlPoints(adjustedPoints)
  }

  const handleMouseUp = (event) => {
    if (event) {
      event.stopPropagation()
    }

    if (!isDragging) return

    if (controlPoints.length > 0) {
      if (onUpdate) {
        onUpdate(arc.id, { control_points: controlPoints }, "arc")
      }
    }

    setIsDragging(false)
    setDragIndex(-1)
    setShowControlPoints(false)

    if (onSelect) {
      onSelect(null)
    }

    if (onArcDragEnd) {
      onArcDragEnd()
    }
  }

  useEffect(() => {
    if (isDragging && dragIndex !== -1) {
      const handleGlobalMouseMove = (event) => {
        handleMouseMove(event)
      }

      const handleGlobalMouseUp = (event) => {
        handleMouseUp(event)
      }

      document.addEventListener("mousemove", handleGlobalMouseMove, { passive: false })
      document.addEventListener("mouseup", handleGlobalMouseUp, { passive: false })

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragIndex, controlPoints, arc.id])

  const calculateArrowAngle = () => {
    const dx = pathData.end.x - pathData.start.x
    const dy = pathData.end.y - pathData.start.y
    return (Math.atan2(dy, dx) * 180) / Math.PI
  }

  const arrowAngle = calculateArrowAngle()

  const handleWeightClick = (event) => {
    event.stopPropagation()
    setIsEditingWeight(true)
  }

  const handleWeightMouseDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    if (onArcDragStart) {
      onArcDragStart()
    }

    const dx = pathData.end.x - pathData.start.x
    const dy = pathData.end.y - pathData.start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const perpX = (-dy / distance) * 50
    const perpY = (dx / distance) * 50

    const midX = (pathData.start.x + pathData.end.x) / 2
    const midY = (pathData.start.y + pathData.end.y) / 2

    const newControlPoints = [{ x: midX + perpX, y: midY + perpY }]
    setControlPoints(newControlPoints)
    setDragIndex(0)
    setIsDragging(true)
    setShowControlPoints(true)
  }

  const handleWeightSubmit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const newWeight = Math.max(1, Number.parseInt(tempWeight, 10) || 1)
    if (onUpdate && newWeight !== arc.weight) {
      onUpdate(arc.id, { weight: newWeight }, "arc")
    }
    setIsEditingWeight(false)
  }

  const handleWeightCancel = (event) => {
    event.stopPropagation()
    setIsEditingWeight(false)
    setTempWeight(arc.weight)
  }

  const handlePropertyUpdate = (property, value) => {
    if (onUpdate) {
      onUpdate(arc.id, { [property]: value }, "arc")
    }
  }

  const handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (onContextMenu) {
      console.log("[v0] Arc context menu triggered", { canBeInhibitor: canBeInhibitor(), arc })
      onContextMenu(event, "arc", arc, {
        canBeInhibitor: canBeInhibitor(),
        currentDirection: arc.source_direction || "BAS",
      })
    }
  }

  const handleWeightContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (onContextMenu) {
      onContextMenu(event, "arc", arc, {
        canBeInhibitor: canBeInhibitor(),
        currentDirection: arc.source_direction || "BAS",
      })
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isEditingWeight && !event.target.closest(".weight-form-container")) {
        setIsEditingWeight(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [isEditingWeight])

  const getPointOnPath = (event) => {
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const dx = pathData.end.x - pathData.start.x
    const dy = pathData.end.y - pathData.start.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length === 0) return { x: mouseX, y: mouseY, t: 0.5 }

    const dotProduct = ((mouseX - pathData.start.x) * dx + (mouseY - pathData.start.y) * dy) / (length * length)
    const t = Math.max(0.1, Math.min(0.9, dotProduct))

    return {
      x: pathData.start.x + dx * t,
      y: pathData.start.y + dy * t,
      t: t,
    }
  }

  const getArcColor = () => {
    if (arc.is_inhibitor) return "#ef4444" // Rouge pour inhibiteur
    if (arc.is_reset) return "#10b981" // Vert pour reset
    return "#374151" // Couleur normale
  }

  const getSelectedColor = () => {
    if (isDragging) return getArcColor()
    return selected ? "#3b82f6" : getArcColor()
  }

  useEffect(() => {
    const newPathData = calculatePath()
    setPathData(newPathData)
  }, [arc, source, target, places, transitions, controlPoints])

  // Helper functions for better path midpoint calculation
  const calculatePathLength = (pathString) => {
    // Simplified path length calculation for rectangular paths
    const commands = pathString.split(/[ML]/).filter((cmd) => cmd.trim())
    let totalLength = 0
    let lastPoint = null

    commands.forEach((cmd) => {
      const coords = cmd
        .trim()
        .split(/[\s,]+/)
        .map(Number)
      if (coords.length >= 2) {
        const currentPoint = { x: coords[0], y: coords[1] }
        if (lastPoint) {
          const dx = currentPoint.x - lastPoint.x
          const dy = currentPoint.y - lastPoint.y
          totalLength += Math.sqrt(dx * dx + dy * dy)
        }
        lastPoint = currentPoint
      }
    })

    return totalLength
  }

  const getPointAtDistance = (pathString, targetDistance) => {
    // Get point at specific distance along rectangular path
    const commands = pathString.split(/[ML]/).filter((cmd) => cmd.trim())
    let currentDistance = 0
    let lastPoint = null

    for (const cmd of commands) {
      const coords = cmd
        .trim()
        .split(/[\s,]+/)
        .map(Number)
      if (coords.length >= 2) {
        const currentPoint = { x: coords[0], y: coords[1] }
        if (lastPoint) {
          const dx = currentPoint.x - lastPoint.x
          const dy = currentPoint.y - lastPoint.y
          const segmentLength = Math.sqrt(dx * dx + dy * dy)

          if (currentDistance + segmentLength >= targetDistance) {
            // Target point is on this segment
            const ratio = (targetDistance - currentDistance) / segmentLength
            return {
              x: lastPoint.x + dx * ratio,
              y: lastPoint.y + dy * ratio,
            }
          }
          currentDistance += segmentLength
        }
        lastPoint = currentPoint
      }
    }

    return lastPoint // Fallback to last point
  }

  return (
    <div className="arc-container">
      <svg
        ref={svgRef}
        className="arc-svg"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        onMouseEnter={() => setShowControlPoints(true)}
        onMouseLeave={() => !isDragging && setShowControlPoints(false)}
      >
        <defs>
          <marker
            id={`arrowhead-${arc.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9.5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {arc.is_inhibitor ? (
              <circle cx="5" cy="3" r="3" fill="none" stroke={getSelectedColor()} strokeWidth="2" />
            ) : arc.is_reset ? (
              <path d="M2,3 L5,0 L8,3 L5,6 z" fill="none" stroke={getSelectedColor()} strokeWidth="2" />
            ) : (
              <path d="M0,0 L0,6 L9,3 z" fill={getSelectedColor()} />
            )}
          </marker>
        </defs>

        <circle
          cx={pathData.start.x}
          cy={pathData.start.y}
          r="3"
          fill={getSelectedColor()}
          className="arc-direction-indicator"
          style={{ opacity: showControlPoints ? 1 : 0 }}
        />

        <path
          d={pathData.path}
          stroke={getSelectedColor()}
          strokeWidth={selected ? "3" : "2"}
          fill="none"
          markerEnd={`url(#arrowhead-${arc.id})`}
          className="arc-line"
          onClick={onSelect}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          style={{
            strokeDasharray: arc.is_inhibitor ? "5,5" : "none",
            cursor: "pointer",
            strokeLinecap: "round", // Added rounded line caps for better appearance
          }}
        />

        <path
          d={pathData.path}
          stroke="transparent"
          strokeWidth="12"
          fill="none"
          className="arc-line-wide"
          onClick={onSelect}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          style={{
            cursor: "pointer",
          }}
        />

        {showControlPoints &&
          controlPoints.map((point, index) => (
            <circle
              key={`${arc.id}-control-${index}`}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={getSelectedColor()}
              stroke="#ffffff"
              strokeWidth="2"
              className="control-point"
              onMouseDown={(e) => handleMouseDown(e, index)}
              style={{
                cursor: isDragging && dragIndex === index ? "grabbing" : "grab",
                pointerEvents: "all",
              }}
            />
          ))}
      </svg>

      <div
        className={`arc-weight ${selected ? "selected" : ""}`}
        style={{
          left: pathData.midPoint.x - 15,
          top: pathData.midPoint.y - 15,
          cursor: "pointer",
        }}
        onClick={handleWeightClick}
        onMouseDown={handleWeightMouseDown}
        onContextMenu={handleWeightContextMenu}
      >
        {isEditingWeight ? (
          <div className="weight-form-container">
            <form onSubmit={handleWeightSubmit} className="weight-form">
              <input
                type="number"
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                autoFocus
                min="1"
                className="weight-input"
                onContextMenu={(e) => e.stopPropagation()}
              />
              <div className="weight-form-buttons">
                <button type="submit" className="weight-form-button weight-form-save">
                  Save
                </button>
                <button type="button" onClick={handleWeightCancel} className="weight-form-button weight-form-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <span className="weight-value">{arc.weight}</span>
        )}
      </div>
    </div>
  )
}

export default Arc
