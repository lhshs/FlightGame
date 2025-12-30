export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LOADING_MISSION = 'LOADING_MISSION'
}

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXTREME';

export type EnemyType = 'NORMAL' | 'ZIGZAG' | 'TANK' | 'INTERCEPTOR';

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  width: number;
  height: number;
  speed: number;
  color: string;
  id: number;
  hp: number;
  maxHp?: number;
  type?: EnemyType;
  sinOffset?: number; 
  sinFrequency?: number; // 무작위 흔들림 주기
  sinAmplitude?: number; // 무작위 흔들림 너비
}

export interface Player extends Entity {
  score: number;
}

export interface MissionBriefing {
  name: string;
  objective: string;
  pilotCallsign: string;
  theme: 'scifi' | 'modern' | 'retro';
}