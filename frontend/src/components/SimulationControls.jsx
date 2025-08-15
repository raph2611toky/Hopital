// src/components/SimulationControls.js
import { Button, Group } from '@mantine/core';
import { Play, Pause, StepForward } from 'lucide-react';

const SimulationControls = ({ onPlay, onPause, onStep, onExport }) => (
  <Group>
    <Button leftIcon={<Play />} onClick={onPlay}>Play</Button>
    <Button leftIcon={<Pause />} onClick={onPause}>Pause</Button>
    <Button leftIcon={<StepForward />} onClick={onStep}>Step</Button>
    <Button onClick={onExport}>Export PNG</Button>
    <Button onClick={onExport}>Export JSON</Button>
  </Group>
);

export default SimulationControls;