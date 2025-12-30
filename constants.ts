import { Difficulty } from "./types";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 40;
export const ENEMY_SIZE = 35;
export const BULLET_SIZE = 6;

export const PLAYER_SPEED = 10; 
export const BULLET_SPEED = 22; 
export const SHOOT_COOLDOWN_MS = 105; // Slightly faster to handle the massive swarm

export const COLORS = {
  PLAYER: '#3b82f6', 
  ENEMY: '#ef4444', 
  ENEMY_ZIGZAG: '#facc15',
  ENEMY_TANK: '#a855f7',
  ENEMY_INTERCEPTOR: '#22d3ee',
  BULLET: '#fbbf24', 
  STAR: '#ffffff',
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, { 
  enemySpeed: number, 
  spawnRate: number, 
  playerHp: number,
  label: string,
  color: string,
  enemyTypes: string[]
}> = {
  BEGINNER: {
    enemySpeed: 4,
    spawnRate: 1500,
    playerHp: 5,
    label: '초급',
    color: 'rgb(34, 197, 94)',
    enemyTypes: ['NORMAL']
  },
  INTERMEDIATE: {
    enemySpeed: 5.5,
    spawnRate: 850,
    playerHp: 3,
    label: '중급',
    color: 'rgb(59, 130, 246)',
    enemyTypes: ['NORMAL', 'ZIGZAG']
  },
  ADVANCED: {
    enemySpeed: 7.5,
    spawnRate: 240, // Increased spawn frequency
    playerHp: 2,
    label: '고급',
    color: 'rgb(249, 115, 22)',
    enemyTypes: ['NORMAL', 'ZIGZAG', 'TANK']
  },
  EXTREME: {
    enemySpeed: 10,
    spawnRate: 65, // Pure madness (0.065s per enemy)
    playerHp: 1,
    label: '최최고급',
    color: 'rgb(239, 68, 68)',
    enemyTypes: ['NORMAL', 'ZIGZAG', 'TANK', 'INTERCEPTOR']
  }
};