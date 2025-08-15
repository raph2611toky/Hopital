export class PetriNet {
  constructor() {
    this.places = {}
    this.transitions = {}
    this.arcs = {}
    this.marking = {}
    this.pendingTransitions = []
    this.markingHistory = []
  }

  addPlace(place) {
    this.places[place.id] = { ...place, capacity: place.capacity || undefined }
    this.marking[place.id] = place.tokens || 0
  }

  addTransition(transition) {
    this.transitions[transition.id] = { ...transition, delayMean: transition.delayMean || 1 }
  }

  addArc(arc) {
    this.arcs[arc.id] = arc
  }

  removePlace(id) {
    delete this.places[id]
    delete this.marking[id]
  }

  removeTransition(id) {
    delete this.transitions[id]
  }

  removeArc(id) {
    delete this.arcs[id]
  }

  isTransitionEnabled(transitionId) {
    const inputArcs = Object.values(this.arcs).filter((arc) => arc.target === transitionId)

    for (const arc of inputArcs) {
      const place = this.places[arc.source]
      if (!place) continue

      const tokens = this.marking[arc.source] || 0

      if (arc.isInhibitor) {
        if (tokens >= arc.weight) return false
      } else {
        if (tokens < arc.weight) return false
      }
    }

    return true
  }

  fireTransition(transitionId) {
    if (!this.isTransitionEnabled(transitionId)) return false

    const inputArcs = Object.values(this.arcs).filter((arc) => arc.target === transitionId)
    const outputArcs = Object.values(this.arcs).filter((arc) => arc.source === transitionId)

    // Consommer les jetons des places d'entrée
    for (const arc of inputArcs) {
      if (!arc.isInhibitor) {
        this.marking[arc.source] = Math.max(0, (this.marking[arc.source] || 0) - arc.weight)
      }
    }

    // Produire des jetons dans les places de sortie
    for (const arc of outputArcs) {
      if (arc.isReset) {
        this.marking[arc.target] = arc.resetValue || 0
      } else {
        this.marking[arc.target] = (this.marking[arc.target] || 0) + arc.weight
      }
    }

    for (const placeId in this.marking) {
      const place = this.places[placeId]
      if (place && place.capacity !== undefined && this.marking[placeId] > place.capacity) {
        console.warn(`Place ${placeId} dépasse capacité (${this.marking[placeId]} > ${place.capacity})`)
        this.marking[placeId] = place.capacity // Limiter automatiquement
      }
    }

    this.markingHistory.push({ ...this.marking, timestamp: Date.now() })
    if (this.markingHistory.length > 1000) {
      this.markingHistory.shift() // Limiter l'historique
    }

    return true
  }

  simulateStep(callback) {
    const enabledTransitions = Object.keys(this.transitions)
      .filter((id) => this.isTransitionEnabled(id))
      .sort((a, b) => (this.transitions[b].priority || 1) - (this.transitions[a].priority || 1))

    if (enabledTransitions.length === 0) {
      console.warn("Deadlock détecté - Pas de vivacité")
      return
    }

    if (enabledTransitions.length > 1) {
      console.log(`Concurrence détectée: ${enabledTransitions.length} transitions possibles`)
    }

    if (enabledTransitions.length > 0) {
      const selectedTransition = enabledTransitions[0] // Prendre la plus haute priorité
      const transition = this.transitions[selectedTransition]

      if (transition.type === "timed") {
        const delay = Math.max(1000, -Math.log(Math.random()) * transition.delayMean * 60000) // Exponentielle en ms
        const timeoutId = setTimeout(() => {
          this.fireTransition(selectedTransition)
          if (callback) callback()
          this.pendingTransitions = this.pendingTransitions.filter((p) => p.id !== selectedTransition)
        }, delay)
        this.pendingTransitions.push({ id: selectedTransition, timeoutId })
      } else {
        this.fireTransition(selectedTransition)
        if (callback) callback()
      }
    }
  }

  clearPendingTransitions() {
    this.pendingTransitions.forEach((p) => clearTimeout(p.timeoutId))
    this.pendingTransitions = []
  }

  getValidation() {
    const enabledTransitions = Object.keys(this.transitions).filter((id) => this.isTransitionEnabled(id))

    return {
      deadlock: enabledTransitions.length === 0,
      concurrent: enabledTransitions.length > 1 ? enabledTransitions.length : 0,
      bounded: Object.keys(this.places).every((placeId) => {
        const place = this.places[placeId]
        return !place.capacity || this.marking[placeId] <= place.capacity
      }),
    }
  }

  toJSON() {
    return JSON.stringify(
      {
        places: this.places,
        transitions: this.transitions,
        arcs: this.arcs,
        marking: this.marking,
      },
      null,
      2,
    )
  }
}
