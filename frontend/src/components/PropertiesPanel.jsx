import { TextInput, NumberInput, Switch, Button, Tabs } from '@mantine/core';

const PropertiesPanel = ({ selected, onUpdate }) => {
  if (!selected) return <div>Select an element to edit</div>;

  const handleSave = (updates) => {
    onUpdate(updates);
  };

  return (
    <div style={{ padding: 10, border: '1px solid gray', width: 300 }}>
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="advanced">Advanced</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="xs">
          <TextInput label="Label" value={selected.data.label} onChange={(e) => onUpdate({ label: e.target.value })} />
          {selected.type === 'place' && (
            <>
              <NumberInput label="Tokens" value={selected.data.tokens || 0} onChange={(v) => onUpdate({ tokens: v })} min={0} />
              <NumberInput label="Capacity" value={selected.data.capacity || 0} onChange={(v) => onUpdate({ capacity: v })} min={0} />
            </>
          )}
          {selected.type === 'transition' && (
            <>
              <NumberInput label="Delay (ms)" value={selected.data.delay || 0} onChange={(v) => onUpdate({ delay: v })} min={0} />
              <NumberInput label="Priority" value={selected.data.priority || 0} onChange={(v) => onUpdate({ priority: v })} min={0} />
            </>
          )}
          {selected.type === 'edge' && (
            <>
              <NumberInput label="Weight" value={selected.data.weight || 1} onChange={(v) => onUpdate({ weight: v })} min={1} />
              <Switch label="Inhibitor" checked={selected.data.isInhibitor || false} onChange={(e) => onUpdate({ isInhibitor: e.currentTarget.checked })} />
              <Switch label="Reset" checked={selected.data.isReset || false} onChange={(e) => onUpdate({ isReset: e.currentTarget.checked })} />
            </>
          )}
        </Tabs.Panel>
        <Tabs.Panel value="advanced" pt="xs">
          {selected.type === 'place' && (
            <TextInput label="Type" value={selected.data.type || 'resource'} onChange={(e) => onUpdate({ type: e.target.value })} />
          )}
          {selected.type === 'transition' && (
            <Switch label="Timed" checked={selected.data.type === 'timed'} onChange={(e) => onUpdate({ type: e.currentTarget.checked ? 'timed' : 'instant' })} />
          )}
        </Tabs.Panel>
      </Tabs>
      <Button onClick={() => handleSave({})} style={{ marginTop: 10 }}>Save</Button>
    </div>
  );
};

export default PropertiesPanel;