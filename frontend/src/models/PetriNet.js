export class PetriNet {
  constructor() {
    this.places = {}
    this.transitions = {}
    this.arcs = {}
    this.marking = {}
  }

  addPlace(place) {
    this.places[place.id] = place
    this.marking[place.id] = place.tokens || 0
  }

  addTransition(transition) {
    this.transitions[transition.id] = transition
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
      this.marking[arc.target] = (this.marking[arc.target] || 0) + arc.weight
    }

    return true
  }

  simulateStep(callback) {
    const enabledTransitions = Object.keys(this.transitions).filter((id) => this.isTransitionEnabled(id))

    if (enabledTransitions.length > 0) {
      const randomTransition = enabledTransitions[Math.floor(Math.random() * enabledTransitions.length)]
      this.fireTransition(randomTransition)
      if (callback) callback()
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
