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
  }, [gameState, difficulty, settings.playerHp, setScore]);

  const spawnEnemy = (now: number) => {
    if (now - lastSpawnTimeRef.current > settings.spawnRate) {
      const typeStr = settings.enemyTypes[Math.floor(Math.random() * settings.enemyTypes.length)];
      const type = typeStr as EnemyType;
      
      let width = ENEMY_SIZE;
      let height = ENEMY_SIZE;
      let hp = 1;
      let color = COLORS.ENEMY;
      let speed = settings.enemySpeed + (Math.random() * 2);

      // Random parameters for ZIGZAG
      let sinFreq = 0.02 + Math.random() * 0.06;
      let sinAmp = 4 + Math.random() * 12;

      if (type === 'TANK') {
        width *= 2;
        height *= 1.6;
        hp = 5; // 단단해진 탱커
        color = COLORS.ENEMY_TANK;
        speed *= 0.5;
      } else if (type === 'ZIGZAG') {
        color = COLORS.ENEMY_ZIGZAG;
      } else if (type === 'INTERCEPTOR') {
        color = COLORS.ENEMY_INTERCEPTOR;
        speed *= 1.4; // 더 빠르게 접근
      }

      const x = Math.random() * (CANVAS_WIDTH - width);
      enemiesRef.current.push({
        x,
        y: -height,
        width,
        height,
        speed,
        color,
        id: Math.random(),
        hp,
        maxHp: hp,
        type,
        sinOffset: Math.random() * Math.PI * 2,
        sinFrequency: sinFreq,
        sinAmplitude: sinAmp
      });
      lastSpawnTimeRef.current = now;
    }
  };

  const createExplosion = (x: number, y: number, color: string, isBig: boolean = false) => {
    soundService.playExplosion();
    const count = isBig ? 40 : 15;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        width: 3 + Math.random() * (isBig ? 12 : 5),
        height: 3 + Math.random() * (isBig ? 12 : 5),
        color,
        speed: 0,
        id: Math.random(),
        hp: 1,
        life: 1.0,
        maxLife: 1.0,
        vx: (Math.random() - 0.5) * (isBig ? 24 : 14),
        vy: (Math.random() - 0.5) * (isBig ? 24 : 14)
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

    if (level === 1) {
      addB(0);
    } else if (level === 2) {
      addB(0, -15); addB(0, 15);
    } else if (level === 3) {
      addB(0); addB(-2.5, -12); addB(2.5, 12);
    } else if (level === 4) {
      addB(-1.2, -8); addB(1.2, 8); addB(-4, -22); addB(4, 22); addB(0);
    } else if (level === 5) {
      addB(0); addB(-2.2, -10); addB(2.2, 10); addB(-4.5, -20); addB(4.5, 20); addB(-8, -38); addB(8, 38);
    } else {
      // Level 6: ULTIMATE 9-WAY
      addB(0); addB(-1.8, -6); addB(1.8, 6); addB(-3.8, -18); addB(3.8, 18); addB(-6.5, -30); addB(6.5, 30); addB(-10, -48); addB(10, 48);
    }
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
    if (player.score >= 40000) newLevel = 6;
    else if (player.score >= 20000) newLevel = 5;
    else if (player.score >= 10000) newLevel = 4;
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
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -50 && b.x > -150 && b.x < CANVAS_WIDTH + 150);

    enemiesRef.current.forEach(e => {
      e.y += e.speed;
      if (e.type === 'ZIGZAG') {
        // Use randomized amplitude and frequency
        e.x += Math.sin(e.y * (e.sinFrequency || 0.03) + (e.sinOffset || 0)) * (e.sinAmplitude || 6);
      } else if (e.type === 'INTERCEPTOR') {
        // Faster tracking for interceptors
        const dx = player.x + player.width / 2 - (e.x + e.width / 2);
        const trackingStrength = difficulty === 'EXTREME' ? 2.5 : 1.8;
        e.x += Math.sign(dx) * trackingStrength;
      }
      
      e.x = Math.max(0, Math.min(CANVAS_WIDTH - e.width, e.x));
    });
    
    particlesRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.035;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    bulletsRef.current.forEach(bullet => {
      enemiesRef.current.forEach(enemy => {
        if (enemy.hp > 0 && 
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y) {
          
          enemy.hp -= 1;
          bullet.y = -2500;
          
          if (enemy.hp <= 0) {
            createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, enemy.type === 'TANK');
            player.score += (enemy.type === 'TANK' ? 800 : 100);
          } else {
            // Spark effect on hit
            for(let i=0; i<4; i++) {
                particlesRef.current.push({
                    x: bullet.x, y: bullet.y, width: 2, height: 2, color: '#fff', speed: 0, id: Math.random(), hp: 1, life: 0.4, maxLife: 0.4,
                    vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12
                });
            }
          }
        }
      });
    });

    if (player.score !== lastSyncedScoreRef.current && now - lastScoreSyncTimeRef.current > 100) {
      setScore(player.score);
      lastSyncedScoreRef.current = player.score;
      lastScoreSyncTimeRef.current = now;
    }

    enemiesRef.current.forEach(enemy => {
      if (enemy.hp > 0 &&
          player.x + 8 < enemy.x + enemy.width - 8 &&
          player.x + player.width - 8 > enemy.x + 8 &&
          player.y + 8 < enemy.y + enemy.height - 8 &&
          player.y + player.height - 8 > enemy.y + 8) {
        
        enemy.hp = 0;
        player.hp -= 1;
        soundService.playHit();
        createExplosion(player.x + player.width/2, player.y + player.height/2, COLORS.PLAYER, true);
        if (player.hp <= 0) setGameState(GameState.GAME_OVER);
      }
    });

    enemiesRef.current = enemiesRef.current.filter(e => e.y <= CANVAS_HEIGHT && e.hp > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid Background
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    const timeOffset = (Date.now() / 20) % 60;
    for(let i=0; i<CANVAS_WIDTH; i+=60) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for(let i=0; i<CANVAS_HEIGHT; i+=60) {
        ctx.beginPath(); ctx.moveTo(0, i + timeOffset); ctx.lineTo(CANVAS_WIDTH, i + timeOffset); ctx.stroke();
    }

    const p = playerRef.current;
    if (p.hp > 0 || (Math.floor(Date.now() / 80) % 2 === 0)) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + p.width, p.y + p.height);
      ctx.lineTo(p.x + p.width / 2, p.y + p.height - 12);
      ctx.lineTo(p.x, p.y + p.height);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    enemiesRef.current.forEach(e => {
      ctx.fillStyle = e.color;
      ctx.shadowBlur = (e.type === 'INTERCEPTOR' || e.type === 'ZIGZAG') ? 10 : 0;
      ctx.shadowColor = e.color;
      
      if (e.type === 'TANK') {
        ctx.fillRect(e.x, e.y, e.width, e.height);
        // HP Bar for tank
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(e.x, e.y - 10, e.width, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x, e.y - 10, (e.hp / (e.maxHp || 1)) * e.width, 5);
      } else {
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + e.width, e.y);
        ctx.lineTo(e.x + e.width / 2, e.y + e.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    ctx.fillStyle = COLORS.BULLET;
    bulletsRef.current.forEach(b => {
        ctx.shadowBlur = 5;
        ctx.shadowColor = COLORS.BULLET;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    ctx.shadowBlur = 0;

    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.width, pt.height);
      ctx.globalAlpha = 1.0;
    });

    // UI
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 14px Rajdhani';
    ctx.textAlign = 'left';
    ctx.fillText(`${missionName.toUpperCase()} | ${settings.label} | LVL ${currentLevelRef.current}`, 20, CANVAS_HEIGHT - 20);
    
    ctx.fillStyle = settings.color;
    for(let i=0; i<playerRef.current.hp; i++) {
        ctx.beginPath();
        ctx.arc(30 + (i * 25), 30, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    if (levelUpMessageTimer.current > 0) {
      ctx.save();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 48px Orbitron';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#fbbf24';
      ctx.fillText('WEAPONS OVERLOAD!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '700 24px Orbitron';
      ctx.fillText(`POWER LEVEL ${currentLevelRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.restore();
    }
  };

  const gameLoop = (time: number) => {
    const dt = 16;
    lastTimeRef.current = time;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        spawnEnemy(time);
        update(dt, time);
        draw(ctx);
      }
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
        style={{ maxWidth: '100%', maxHeight: '80vh', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
      />
    </div>
  );
});

export default GameCanvas;