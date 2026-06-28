'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState } from '../lib/gameState';

type State = {
  currentState: GameState;
  currentSceneId: number;
  scene2Won: boolean;
};

type Action =
  | { type: 'TRANSITION'; payload: GameState }
  | { type: 'NEXT_SCENE' }
  | { type: 'RESTART' }
  | { type: 'SET_SCENE2_WON'; payload: boolean };

const initialState: State = {
  currentState: GameState.SCENE_INTRO,
  currentSceneId: 1,
  scene2Won: false,
};

function gameReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TRANSITION':
      return { ...state, currentState: action.payload };
    case 'NEXT_SCENE':
      return {
        ...state,
        currentSceneId: state.currentSceneId + 1,
        currentState: GameState.SCENE_INTRO,
      };
    case 'RESTART':
      return { ...initialState };
    case 'SET_SCENE2_WON':
      return { ...state, scene2Won: action.payload };
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}
