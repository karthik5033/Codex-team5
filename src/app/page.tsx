'use client';
import { GameProvider } from '../hooks/useGameState';
import { GameContainer } from '../components/GameContainer';

export default function Home() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}
