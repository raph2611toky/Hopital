import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  ReactFlowProvider,
  useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import PropertiesPanel from './PropertiesPanel';
import SimulationControls from './SimulationControls';
import ContextMenu from './ContextMenu';
import { PetriNet } from '../models/PetriNet';
import html2canvas from 'html2canvas';
import './PetriEditor.css';

const nodeTypes = { place: CustomNode, transition: CustomNode };
const edgeTypes = { custom: CustomEdge };

const initialPlaces = [
  { id: 'p1', label: 'Medecins_Generaux_libres', tokens: 4, type: 'resource', capacity: 4 },
  { id: 'p2', label: 'SagesFemmes_libres', tokens: 6, type: 'resource', capacity: 6 },
  { id: 'p3', label: 'Stagiaires_Generaux_libres', tokens: 7, type: 'resource', capacity: 7 },
  { id: 'p4', label: 'Stagiaires_SF_libres', tokens: 8, type: 'resource', capacity: 8 },
  { id: 'p5', label: 'Chirurgiens_libres', tokens: 3, type: 'resource', capacity: 3 },
  { id: 'p6', label: 'Bureaux_Consultation_libres', tokens: 4, type: 'resource', capacity: 4 },
  { id: 'p7', label: 'Salles_Operation_libres', tokens: 2, type: 'resource', capacity: 2 },
  { id: 'p8', label: 'SalleMat_1_libre', tokens: 3, type: 'resource', capacity: 3 },
  { id: 'p9', label: 'SalleMat_2_libre', tokens: 3, type: 'resource', capacity: 3 },
  { id: 'p10', label: 'SalleMat_3_libre', tokens: 3, type: 'resource', capacity: 3 },
  { id: 'p11', label: 'SalleMat_4_libre', tokens: 3, type: 'resource', capacity: 3 },
  { id: 'p12', label: 'File_Attente_Consultation', tokens: 0, type: 'queue' },
  { id: 'p13', label: 'File_Attente_Maternite', tokens: 0, type: 'queue' },
  { id: 'p14', label: 'Patients_en_Consultation', tokens: 0, type: 'state' },
  { id: 'p15', label: 'Patients_en_Travail_Maternite', tokens: 0, type: 'state' },
  { id: 'p16', label: 'Patients_en_PreOp', tokens: 0, type: 'state' },
  { id: 'p17', label: 'Patients_en_PostOp', tokens: 0, type: 'state' },
  { id: 'p18', label: 'Patients_Sortis', tokens: 0, type: 'state' },
  { id: 'p19', label: 'Heures_Garde_Stagiaire_1', tokens: 12, type: 'resource', capacity: 12 },
  // Add more Heures_Garde_Stagiaire for each intern (up to 15)
];

const initialTransitions = [
  { id: 't1', label: 'Arrivee_Patient', type: 'instant', delay: 0, priority: 1 },
  { id: 't2', label: 'Debut_Consultation', type: 'timed', delay: 1800000, priority: 2 }, // 30min
  { id: 't3', label: 'Fin_Consultation', type: 'instant', delay: 0, priority: 2 },
  { id: 't4', label: 'Debut_PriseEnCharge_Maternite', type: 'timed', delay: 3600000, priority: 3 }, // 1h avg
  { id: 't5', label: 'Fin_PriseEnCharge', type: 'instant', delay: 0, priority: 3 },
  { id: 't6', label: 'Debut_Operation', type: 'timed', delay: 14400000, priority: 5 }, // 4h
  { id: 't7', label: 'Fin_Operation', type: 'instant', delay: 0, priority: 5 },
  { id: 't8', label: 'Debut_Jour', type: 'instant', delay: 0, priority: 1 },
  { id: 't9', label: 'Debut_Nuit', type: 'instant', delay: 0, priority: 1 },
  { id: 't10', label: 'Reset_Quotidien', type: 'instant', delay: 0, priority: 1 },
];

const initialArcs = [
  { id: 'a1', source: 'p12', target: 't2', weight: 1, isInhibitor: false, isReset: false }, // File to Consult
  { id: 'a2', source: 'p6', target: 't2', weight: 1, isInhibitor: false, isReset: false }, // Bureau
  { id: 'a3', source: 'p1', target: 't2', weight: 1, isInhibitor: false, isReset: false }, // Medecin
  { id: 'a4', target: 'p14', source: 't2', weight: 1, isInhibitor: false, isReset: false }, // Patients in Consult
  { id: 'a5', target: 'p6', source: 't3', weight: 1, isInhibitor: false, isReset: false }, // Free Bureau
  { id: 'a6', target: 'p1', source: 't3', weight: 1, isInhibitor: false, isReset: false }, // Free Medecin
  // Add more arcs for maternity, operations, shifts, etc.
];

const PetriEditorInner = () => {
  const netRef = useRef(new PetriNet());
  const reactFlowInstance = useReactFlow();
  
  // Initialize Petri net
  initialPlaces.forEach(p => netRef.current.addPlace(p));
  initialTransitions.forEach(t => netRef.current.addTransition(t));
  initialArcs.forEach(a => netRef.current.addArc(a));

  const initialNodes = [
    ...initialPlaces.map((p, index) => ({ 
      id: p.id, 
      type: 'place', 
      data: { label: p.label, tokens: p.tokens, nodeType: 'place' }, 
      position: { x: 100 + (index % 3) * 200, y: 100 + Math.floor(index / 3) * 150 } 
    })),
    ...initialTransitions.map((t, index) => ({ 
      id: t.id, 
      type: 'transition', 
      data: { label: t.label, nodeType: 'transition' }, 
      position: { x: 200 + (index % 3) * 200, y: 200 + Math.floor(index / 3) * 150 } 
    })),
  ];

  const initialEdges = initialArcs.map(a => ({
    id: a.id, 
    source: a.source, 
    target: a.target, 
    type: 'custom', 
    data: { weight: a.weight, isInhibitor: a.isInhibitor, isReset: a.isReset }
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState(null);
  const [simulationInterval, setSimulationInterval] = useState(null);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false, type: null, target: null });
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [dragMode, setDragMode] = useState(false);
  const reactFlowWrapper = useRef(null);

  const onConnect = useCallback((params) => {
    const newEdge = {
      id: `e${Date.now()}`,
      source: params.source,
      target: params.target,
      type: 'custom',
      data: { weight: 1, isInhibitor: false, isReset: false }
    };
    setEdges((eds) => addEdge(newEdge, eds));
    netRef.current.addArc({ 
      id: newEdge.id, 
      source: newEdge.source, 
      target: newEdge.target, 
      weight: 1, 
      isInhibitor: false, 
      isReset: false 
    });
  }, [setEdges]);

  const onNodeClick = (event, node) => {
    event.stopPropagation();
    if (connectingFrom && connectingFrom !== node.id) {
      // Create connection
      const newEdge = {
        id: `e${Date.now()}`,
        source: connectingFrom,
        target: node.id,
        type: 'custom',
        data: { weight: 1, isInhibitor: false, isReset: false }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setConnectingFrom(null);
      setDragMode(false);
    } else {
      setSelected(node);
    }
  };

  const onEdgeClick = (event, edge) => {
    event.stopPropagation();
    setSelected(edge);
  };

  const onNodeContextMenu = (event, node) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true,
      type: 'node',
      target: node
    });
  };

  const onEdgeContextMenu = (event, edge) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true,
      type: 'edge',
      target: edge
    });
  };

  const onPaneContextMenu = (event) => {
    event.preventDefault();
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true,
      type: 'pane',
      position: position
    });
  };

  const onNodeMouseDown = (event, node) => {
    if (event.shiftKey) {
      event.preventDefault();
      setConnectingFrom(node.id);
      setDragMode(true);
    }
  };

  const updateSelected = (updates) => {
    if (selected && (selected.type === 'place' || selected.type === 'transition')) {
      setNodes((nds) => nds.map(n => 
        n.id === selected.id ? { ...n, data: { ...n.data, ...updates } } : n
      ));
      
      // Update Petri net model
      if (selected.data.nodeType === 'place') {
        const place = netRef.current.places[selected.id];
        if (place) {
          Object.assign(place, updates);
        }
      } else if (selected.data.nodeType === 'transition') {
        const transition = netRef.current.transitions[selected.id];
        if (transition) {
          Object.assign(transition, updates);
        }
      }
    } else if (selected && selected.source) { // It's an edge
      setEdges((eds) => eds.map(e => 
        e.id === selected.id ? { ...e, data: { ...e.data, ...updates } } : e
      ));
      
      // Update arc in Petri net model
      const arc = netRef.current.arcs[selected.id];
      if (arc) {
        Object.assign(arc, updates);
      }
    }
  };

  const addPlace = (position) => {
    const id = `p${Date.now()}`;
    const newPlace = { id, label: 'New Place', tokens: 0, type: 'resource' };
    netRef.current.addPlace(newPlace);
    setNodes((nds) => [...nds, { 
      id, 
      type: 'place', 
      data: { label: 'New Place', tokens: 0, nodeType: 'place' }, 
      position 
    }]);
  };

  const addTransition = (position) => {
    const id = `t${Date.now()}`;
    const newTrans = { id, label: 'New Transition', type: 'instant', delay: 0, priority: 0 };
    netRef.current.addTransition(newTrans);
    setNodes((nds) => [...nds, { 
      id, 
      type: 'transition', 
      data: { label: 'New Transition', nodeType: 'transition' }, 
      position 
    }]);
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    
    // Remove from Petri net model
    delete netRef.current.places[nodeId];
    delete netRef.current.transitions[nodeId];
    
    // Remove related arcs
    Object.keys(netRef.current.arcs).forEach(arcId => {
      const arc = netRef.current.arcs[arcId];
      if (arc.source === nodeId || arc.target === nodeId) {
        delete netRef.current.arcs[arcId];
      }
    });
    
    setSelected(null);
  };

  const deleteEdge = (edgeId) => {
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
    delete netRef.current.arcs[edgeId];
    setSelected(null);
  };

  const addTokens = (nodeId, amount) => {
    setNodes((nds) => nds.map(n => 
      n.id === nodeId ? { 
        ...n, 
        data: { 
          ...n.data, 
          tokens: Math.max(0, (n.data.tokens || 0) + amount) 
        } 
      } : n
    ));
    
    // Update Petri net model
    const place = netRef.current.places[nodeId];
    if (place) {
      place.tokens = Math.max(0, (place.tokens || 0) + amount);
      netRef.current.marking[nodeId] = place.tokens;
    }
  };

  const playSimulation = () => {
    if (!simulationInterval) {
      const interval = setInterval(() => {
        netRef.current.simulateStep(() => {
          setNodes((nds) => nds.map(n => ({ 
            ...n, 
            data: { 
              ...n.data, 
              tokens: netRef.current.marking[n.id] || n.data.tokens || 0 
            } 
          })));
        });
      }, 1000);
      setSimulationInterval(interval);
    }
  };

  const pauseSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
  };

  const stepSimulation = () => {
    netRef.current.simulateStep(() => {
      setNodes((nds) => nds.map(n => ({ 
        ...n, 
        data: { 
          ...n.data, 
          tokens: netRef.current.marking[n.id] || n.data.tokens || 0 
        } 
      })));
    });
  };

  const exportPNG = () => {
    if (reactFlowWrapper.current) {
      html2canvas(reactFlowWrapper.current).then(canvas => {
        const link = document.createElement('a');
        link.download = 'petri-net.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  const exportJSON = () => {
    const data = {
      nodes: nodes,
      edges: edges,
      petriNet: netRef.current.toJSON()
    };
    const link = document.createElement('a');
    link.download = 'petri-net.json';
    link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    link.click();
  };

  return (
    <div className="petri-editor">
      <div className="editor-header">
        <h1>Éditeur de Réseaux de Petri - Hôpital</h1>
        <div className="toolbar">
          <button 
            className={`tool-btn ${dragMode ? 'active' : ''}`}
            onClick={() => setDragMode(!dragMode)}
            title="Mode connexion (Shift + clic)"
          >
            🔗 Connexion
          </button>
          <div className="tool-info">
            Shift + clic pour créer des arcs | Clic droit pour les menus
          </div>
        </div>
      </div>
      
      <div className="editor-content">
        <div ref={reactFlowWrapper} className="flow-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onNodeMouseDown={onNodeMouseDown}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className={dragMode ? 'connecting-mode' : ''}
          >
            <Background color="#f0f0f0" gap={20} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                if (node.type === 'place') return '#4CAF50';
                return '#2196F3';
              }}
            />
          </ReactFlow>
          
          <ContextMenu
            contextMenu={contextMenu}
            onClose={() => setContextMenu({ ...contextMenu, visible: false })}
            onAddPlace={addPlace}
            onAddTransition={addTransition}
            onDeleteNode={deleteNode}
            onDeleteEdge={deleteEdge}
            onAddTokens={addTokens}
          />
        </div>
        
        <div className="sidebar">
          <PropertiesPanel 
            selected={selected} 
            onUpdate={updateSelected} 
          />
          <SimulationControls 
            onPlay={playSimulation} 
            onPause={pauseSimulation} 
            onStep={stepSimulation} 
            onExportPNG={exportPNG}
            onExportJSON={exportJSON}
            isPlaying={!!simulationInterval}
          />
        </div>
      </div>
    </div>
  );
};

const PetriEditor = () => (
  <ReactFlowProvider>
    <PetriEditorInner />
  </ReactFlowProvider>
);

export default PetriEditor;
