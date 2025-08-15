export class PetriNet {
  constructor() {
    this.places = {};
    this.transitions = {};
    this.arcs = [];
    this.marking = {};
  }

  addPlace(place) {
    this.places[place.id] = place;
    this.marking[place.id] = place.tokens || 0;
  }

  addTransition(trans) {
    this.transitions[trans.id] = trans;
  }

  addArc(arc) {
    this.arcs.push(arc);
  }

  getInputs(transId) {
    return this.arcs.filter(a => a.target === transId);
  }

  getOutputs(transId) {
    return this.arcs.filter(a => a.source === transId);
  }

  isFireable(transId) {
    const inputs = this.getInputs(transId);
    for (const arc of inputs) {
      if (arc.isInhibitor) {
        if (this.marking[arc.source] >= arc.weight) return false;
      } else {
        if (this.marking[arc.source] < arc.weight) return false;
      }
    }
    return true;
  }

  fire(transId) {
    if (!this.isFireable(transId)) return;
    const inputs = this.getInputs(transId);
    const outputs = this.getOutputs(transId);
    inputs.forEach(arc => {
      if (!arc.isInhibitor) {
        this.marking[arc.source] -= arc.weight;
      }
      if (arc.isReset) this.marking[arc.source] = 0;
    });
    outputs.forEach(arc => {
      this.marking[arc.target] = (this.marking[arc.target] || 0) + arc.weight;
      const place = this.places[arc.target];
      if (place.capacity && this.marking[arc.target] > place.capacity) {
        alert(`Capacity exceeded for ${place.label}!`);
        this.marking[arc.target] = place.capacity;
      }
    });
  }

  simulateStep(onUpdate) {
    const fireable = Object.keys(this.transitions)
      .filter(t => this.isFireable(t))
      .sort((a, b) => this.transitions[b].priority - this.transitions[a].priority);
    if (fireable.length === 0) {
      alert('Deadlock detected!');
      return;
    }
    const trans = this.transitions[fireable[0]];
    if (trans.type === 'timed') {
      setTimeout(() => {
        this.fire(fireable[0]);
        onUpdate();
      }, trans.delay + Math.random() * trans.delay * 0.2);
    } else {
      this.fire(fireable[0]);
      onUpdate();
    }
  }

  toJSON() {
    return JSON.stringify({ places: this.places, transitions: this.transitions, arcs: this.arcs, marking: this.marking });
  }
}