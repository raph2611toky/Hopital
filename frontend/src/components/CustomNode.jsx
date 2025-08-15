import { Handle, Position } from "reactflow"
import "./CustomNode.css"

const CustomNode = ({ data, type, selected }) => {
  const isPlace = type === "place"

  return (
    <div className={`custom-node ${type} ${selected ? "selected" : ""}`} data-id={data.id}>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />

      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {isPlace && data.tokens !== undefined && (
          <div className="token-display">
            <div className="tokens-container">
              {Array.from({ length: Math.min(data.tokens, 6) }, (_, i) => (
                <div key={i} className="token" />
              ))}
              {data.tokens > 6 && <div className="token-count">+{data.tokens - 6}</div>}
            </div>
            <div className="token-text">{data.tokens} jetons</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomNode
