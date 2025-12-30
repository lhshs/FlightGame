import React, { useEffect, useRef, memo } from 'react';
import { Entity, GameState, Point, Player, Difficulty, EnemyType } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SIZE, 
  ENEMY_SIZE, 
  BULLET_SIZE, 
  BULLET_SPEED, 
  COLORS,
  SHOOT_COOLDOWN_MS,
  DIFFICULTY_SETTINGS
} from '../constants';
import { soundService } from '../services/soundService';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  missionName: string;
  difficulty: Difficulty;
}

const GameCanvas: React.FC<GameCanvasProps> = memo(({ gameState, setGameState, setScore, missionName, difficulty }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = DIFFICULTY_SETTINGS[difficulty];

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastShotTimeRef = useRef<number>(0);
  const lastScoreSyncTimeRef = useRef<number>(0);
  const lastSyncedScoreRef = useRef<number>(0);
  const currentLevelRef = useRef<number>(1);
  const levelUpMessageTimer = useRef<number>(0);
  
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 100,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: 0,
    color: COLORS.PLAYER,
    id: 0,
    hp: settings.playerHp,
    score: 0
  });

  const enemiesRef = useRef<Entity[]>([]);
  const bulletsRef = useRef<(Entity & { vx?: number })[]>([]);
  const particlesRef = useRef<(Entity & { life: number; maxLife: number; vx: number; vy: number })[]>([]);
  const mousePos = useRef<Point | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePos.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };
    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePos.current = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      playerRef.current = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 100,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        speed: 0,
        color: COLORS.PLAYER,
        id: 0,
        hp: settings.playerHp,
        score: 0
      };
      enemiesRef.current = [];
      bulletsRef.current = [];
      particlesRef.current = [];
      currentLevelRef.current = 1;
      levelUpMessageTimer.current = 0;
      mousePos.current = null;
      setScore(0);
      lastSyncedScoreRef.current = 0;
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, difficulty, settings.playerHp]);

  const spawnEnemy = (now: number) => {
    if (now - lastSpawnTimeRef.current > settings.spawnRate) {
      const typeStr = settings.enemyTypes[Math.floor(Math.random() * settings.enemyTypes.length)];
      const type = typeStr as EnemyType;
      
      let width = ENEMY_SIZE;
      let height = ENEMY_SIZE;
      let hp = 1;
      let color = COLORS.ENEMY;
      let speed = settings.enemySpeed + (Math.random() * 2);

      if (type === 'TANK') {
        width *= 2; height *= 1.6; hp = 5; color = COLORS.ENEMY_TANK; speed *= 0.5;
      } else if (type === 'ZIGZAG') {
        color = COLORS.ENEMY_ZIGZAG;
      } else if (type === 'INTERCEPTOR') {
        color = COLORS.ENEMY_INTERCEPTOR; speed *= 1.4;
      }

      const x = Math.random() * (CANVAS_WIDTH - width);
      enemiesRef.current.push({
        x, y: -height, width, height, speed, color, id: Math.random(), hp, maxHp: hp, type,
        sinOffset: Math.random() * Math.PI * 2,
        sinFrequency: 0.02 + Math.random() * 0.06,
        sinAmplitude: 4 + Math.random() * 12
      });
      lastSpawnTimeRef.current = now;
    }
  };

  const createExplosion = (x: number, y: number, color: string, isBig: boolean = false) => {
    soundService.playExplosion();
    const count = isBig ? 40 : 15;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y, width: 3 + Math.random() * 5, height: 3 + Math.random() * 5, color, speed: 0, id: Math.random(), hp: 1, life: 1.0, maxLife: 1.0,
        vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15
      });
    }
  };

  const fireMissiles = (player: Player) => {
    const level = currentLevelRef.current;
    const centerX = player.x + player.width / 2 - BULLET_SIZE / 2;
    const centerY = player.y;
    soundService.playShoot();

    const addB = (vx: number = 0, offsetX: number = 0) => {
      bulletsRef.current.push({ x: centerX + offsetX, y: centerY, width: BULLET_SIZE, height: BULLET_SIZE * 3, speed: BULLET_SPEED, vx, color: COLORS.BULLET, id: Math.random(), hp: 1 });
    };

    if (level === 1) addB(0);
    else if (level === 2) { addB(0, -15); addB(0, 15); }
    else if (level === 3) { addB(0); addB(-2.5, -12); addB(2.5, 12); }
    else { addB(0); addB(-2, -8); addB(2, 8); addB(-5, -20); addB(5, 20); }
  };

  const update = (dt: number, now: number) => {
    const player = playerRef.current;
    if (mousePos.current) {
      player.x += (mousePos.current.x - player.width / 2 - player.x) * 0.35;
      player.y += (mousePos.current.y - player.height / 2 - player.y) * 0.35;
    }
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

    let newLevel = 1;
    if (player.score >= 10000) newLevel = 4;
    else if (player.score >= 4000) newLevel = 3;
    else if (player.score >= 1200) newLevel = 2;

    if (newLevel > currentLevelRef.current) {
      currentLevelRef.current = newLevel;
      levelUpMessageTimer.current = 100;
      soundService.playLevelUp();
    }
    if (levelUpMessageTimer.current > 0) levelUpMessageTimer.current--;

    if (now - lastShotTimeRef.current > SHOOT_COOLDOWN_MS) {
      fireMissiles(player);
      lastShotTimeRef.current = now;
    }

    bulletsRef.current.forEach(b => {
      b.y -= b.speed;
      if (b.vx) b.x += b.vx;
    });
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -50);

    enemiesRef.current.forEach(e => {
      e.y += e.speed;
      if (e.type === 'ZIGZAG') {
        e.x += Math.sin(e.y * (e.sinFrequency || 0.03) + (e.sinOffset || 0)) * (e.sinAmplitude || 6);
      } else if (e.type === 'INTERCEPTOR') {
        const dx = player.x + player.width / 2 - (e.x + e.width / 2);
        e.x += Math.sign(dx) * 2;
      }
      e.x = Math.max(0, Math.min(CANVAS_WIDTH - e.width, e.x));
    });
    
    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.035; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    bulletsRef.current.forEach(bullet => {
      enemiesRef.current.forEach(enemy => {
        if (enemy.hp > 0 && 
            bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
          enemy.hp -= 1; bullet.y = -2500;
          if (enemy.hp <= 0) {
            createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, enemy.type === 'TANK');
            player.score += (enemy.type === 'TANK' ? 800 : 100);
          }
        }
      });
    });

    if (player.score !== lastSyncedScoreRef.current && now - lastScoreSyncTimeRef.current > 100) {
      setScore(player.score); lastSyncedScoreRef.current = player.score; lastScoreSyncTimeRef.current = now;
    }

    enemiesRef.current.forEach(enemy => {
      if (enemy.hp > 0 &&
          player.x + 8 < enemy.x + enemy.width - 8 && player.x + player.width - 8 > enemy.x + 8 &&
          player.y + 8 < enemy.y + enemy.height - 8 && player.y + player.height - 8 > enemy.y + 8) {
        enemy.hp = 0; player.hp -= 1; soundService.playHit();
        createExplosion(player.x + player.width/2, player.y + player.height/2, COLORS.PLAYER, true);
        if (player.hp <= 0) setGameState(GameState.GAME_OVER);
      }
    });

    enemiesRef.current = enemiesRef.current.filter(e => e.y <= CANVAS_HEIGHT && e.hp > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const p = playerRef.current;
    if (p.hp > 0 || (Math.floor(Date.now() / 80) % 2 === 0)) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + p.width, p.y + p.height);
      ctx.lineTo(p.x, p.y + p.height);
      ctx.closePath();
      ctx.fill();
    }

    enemiesRef.current.forEach(e => {
      ctx.fillStyle = e.color;
      if (e.type === 'TANK') ctx.fillRect(e.x, e.y, e.width, e.height);
      else {
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.width, e.y); ctx.lineTo(e.x + e.width / 2, e.y + e.height); ctx.closePath(); ctx.fill();
      }
    });

    ctx.fillStyle = COLORS.BULLET;
    bulletsRef.current.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life; ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, pt.width, pt.height); ctx.globalAlpha = 1.0;
    });

    ctx.fillStyle = 'white';
    ctx.font = '14px Rajdhani';
    ctx.fillText(`${missionName.toUpperCase()} | LVL ${currentLevelRef.current}`, 20, CANVAS_HEIGHT - 20);
  };

  const gameLoop = (time: number) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) { spawnEnemy(time); update(16, time); draw(ctx); }
    }
    if (gameState === GameState.PLAYING) requestRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-slate-800">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block bg-slate-950 cursor-none touch-none w-full max-w-[100vw]"
      />
    </div>
  );
});

export default GameCanvas;