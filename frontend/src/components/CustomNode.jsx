import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, type, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const isPlace = type === 'place' || data.nodeType === 'place';
  const tokens = data.tokens || 0;
  
  const getNodeStyle = () => {
    const baseStyle = {
      border: selected ? '3px solid #2196F3' : '2px solid #333',
      borderRadius: isPlace ? '50%' : '8px',
      width: isPlace ? 80 : 120,
      height: isPlace ? 80 : 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isPlace ? '#E8F5E8' : '#E3F2FD',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    };
    
    if (isPlace && tokens > 0) {
      baseStyle.background = '#C8E6C9';
      baseStyle.borderColor = '#4CAF50';
    }
    
    return baseStyle;
  };

  const renderTokens = () => {
    if (!isPlace || tokens === 0) return null;
    
    if (tokens <= 5) {
      // Show individual dots for small numbers
      const dots = [];
      for (let i = 0; i < tokens; i++) {
        const angle = (i * 2 * Math.PI) / tokens;
        const radius = 15;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        dots.push(
          <div
            key={i}
            className="token-dot"
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#2E7D32',
              transform: 'translate(-50%, -50%)'
            }}
          />
        );
      }
      return dots;
    } else {
      // Show number for large amounts
      return (
        <div className="token-count" style={{
          position: 'absolute',
          bottom: '-8px',
          right: '-8px',
          background: '#4CAF50',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          {tokens}
        </div>
      );
    }
  };

  return (
    <div 
      style={getNodeStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`custom-node ${isPlace ? 'place-node' : 'transition-node'}`}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          background: '#333', 
          width: '8px', 
          height: '8px',
          border: '2px solid white'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: '#333', 
          width: '8px', 
          height: '8px',
          border: '2px solid white'
        }} 
      />
      
      <div className="node-content" style={{
        textAlign: 'center',
        fontSize: isPlace ? '11px' : '12px',
        fontWeight: '500',
        color: '#333',
        maxWidth: '90%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: isPlace ? 'nowrap' : 'normal',
        lineHeight: isPlace ? '1' : '1.2'
      }}>
        {data.label}
      </div>
      
      {renderTokens()}
      
      {isHovered && (
        <div className="node-tooltip" style={{
          position: 'absolute',
          top: '-35px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          zIndex: 1000
        }}>
          {isPlace ? `Place: ${tokens} jetons` : 'Transition'}
        </div>
      )}
    </div>
  );
};

export default CustomNode;
