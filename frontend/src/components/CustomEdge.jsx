import React, { useState } from 'react';
import { EdgeLabelRenderer, getBezierPath } from 'reactflow';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style = {} }) => {
  const [weight, setWeight] = useState(data.weight || 1);
  const [isEditing, setIsEditing] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const handleWeightChange = (e) => {
    const newWeight = parseInt(e.target.value, 10) || 1;
    setWeight(newWeight);
    data.weight = newWeight; // Update data for persistence
  };

  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeDasharray: data.isInhibitor ? '5,5' : 'none' }}
        d={edgePath}
        fill="none"
        onClick={() => setIsEditing(true)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: 5,
            border: '1px solid #ccc',
          }}
        >
          {isEditing ? (
            <input
              type="number"
              value={weight}
              onChange={handleWeightChange}
              onBlur={() => setIsEditing(false)}
              style={{ width: '40px', padding: '2px' }}
              autoFocus
            />
          ) : (
            <span onClick={() => setIsEditing(true)}>{weight > 1 ? weight : ''}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
