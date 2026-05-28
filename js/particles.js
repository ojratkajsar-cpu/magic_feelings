/* ============================================================
   MAGIC OF FEELINGS — js/particles.js
   GPU-Optimized Canvas Particle Engine & Render Loop
   ============================================================ */

// Global particle arrays and state
window.trail = [];
window.floaters = [];
window.fireflies = [];
window.confetti = [];
window.mx = -100;
window.my = -100;
window.isMoving = false;
window.mouseSpeed = 0;
window.lastMx = -100;
window.lastMy = -100;
window.bellCooldown = 0;
window.floatingActive = false;
window.confettiActive = false;

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cursorDot = document.getElementById('cursor-dot');
const heartsContainer = document.getElementById('hearts-container');

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// DYNAMIC PERFORMANCE DETECTION
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Dynamic performance ceilings
const maxFireflies = isMobile ? 12 : 28;
const maxConfetti = isMobile ? 70 : 200;
window.maxHeartWave = isMobile ? 24 : 65; // Optimized for mobile
window.heartSpawnRate = isMobile ? 0.05 : 0.12;
const maxTrailParticles = isMobile ? 10 : 35; // Limit trail density on mobile

// HIGH PERFORMANCE OFFSCREEN CANVAS CACHING FOR FIREFLY GLOWS
const glowCacheGold = document.createElement('canvas');
glowCacheGold.width = 40;
glowCacheGold.height = 40;
const gcGold = glowCacheGold.getContext('2d');
const gradGold = gcGold.createRadialGradient(20, 20, 0, 20, 20, 20);
gradGold.addColorStop(0, 'rgba(255, 235, 170, 1)');
gradGold.addColorStop(0.25, 'rgba(255, 200, 100, 0.45)');
gradGold.addColorStop(1, 'rgba(255, 200, 100, 0)');
gcGold.fillStyle = gradGold;
gcGold.beginPath();
gcGold.arc(20, 20, 20, 0, Math.PI * 2);
gcGold.fill();

const glowCachePink = document.createElement('canvas');
glowCachePink.width = 40;
glowCachePink.height = 40;
const gcPink = glowCachePink.getContext('2d');
const gradPink = gcPink.createRadialGradient(20, 20, 0, 20, 20, 20);
gradPink.addColorStop(0, 'rgba(255, 185, 215, 1)');
gradPink.addColorStop(0.25, 'rgba(255, 120, 170, 0.45)');
gradPink.addColorStop(1, 'rgba(255, 120, 170, 0)');
gcPink.fillStyle = gradPink;
gcPink.beginPath();
gcPink.arc(20, 20, 20, 0, Math.PI * 2);
gcPink.fill();

// Draw helpers
function drawHeart(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y + r * 0.35);
  c.bezierCurveTo(x, y - r * 0.45, x - r, y - r * 0.45, x - r, y + r * 0.1);
  c.bezierCurveTo(x - r, y + r * 0.65, x, y + r * 1.15, x, y + r * 1.35);
  c.bezierCurveTo(x, y + r * 1.15, x + r, y + r * 0.65, x + r, y + r * 0.1);
  c.bezierCurveTo(x + r, y - r * 0.45, x, y - r * 0.45, x, y + r * 0.35);
  c.fill();
}

function drawStar(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const ang = (i * 4 * Math.PI / 5) - Math.PI / 2;
    const ang2 = ang + 2 * Math.PI / 5;
    if (i === 0) c.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
    else c.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
    c.lineTo(x + Math.cos(ang2) * r * 0.35, y + Math.sin(ang2) * r * 0.35);
  }
  c.closePath();
  c.fill();
}

// ── Trail Particle ──
class TrailParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 1;
    this.decay = 0.018 + Math.random() * 0.022; // slightly faster decay for smoothness
    this.size = 6 + Math.random() * 8; // slightly smaller on mobile
    this.vx = (Math.random() - 0.5) * 1.8;
    this.vy = -0.5 - Math.random() * 1.5;
    this.type = Math.random() < 0.55 ? 'heart' : 'star';
    this.hue = 330 + Math.random() * 45;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.04;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.life -= this.decay;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.life * 0.85;
    ctx.fillStyle = `hsl(${this.hue}, 95%, 78%)`;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (this.type === 'heart') {
      drawHeart(ctx, 0, 0, this.size * this.life);
    } else {
      drawStar(ctx, 0, 0, this.size * 0.7 * this.life);
    }
    ctx.restore();
  }
}

// ── Floating Heart ──
class FloatHeart {
  constructor(x, y, big) {
    this.x = x || Math.random() * W;
    this.y = y || H + 20;
    this.size = big ? (14 + Math.random() * 18) : (5 + Math.random() * 10);
    this.vx = (Math.random() - 0.5) * 1.1;
    this.vy = -(0.8 + Math.random() * 1.4);
    this.life = 1;
    this.decay = 0.0035 + Math.random() * 0.0045;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.02 + Math.random() * 0.02;
    this.hue = 335 + Math.random() * 35;
    this.sat = 75 + Math.random() * 25;
  }
  update() {
    this.wobble += this.wobbleSpeed;
    this.x += this.vx + Math.sin(this.wobble) * 0.4;
    this.y += this.vy;
    this.life -= this.decay;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.life * 0.8;
    ctx.fillStyle = `hsl(${this.hue}, ${this.sat}%, 74%)`;
    ctx.translate(this.x, this.y);
    drawHeart(ctx, 0, 0, this.size);
    ctx.restore();
  }
}

// ── Firefly ──
class Firefly {
  constructor() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.size = 1.8 + Math.random() * 2.2;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0.01 + Math.random() * 0.02;
    this.type = Math.random() < 0.6 ? 'gold' : 'pink';
    
    this.alpha = 0.3 + Math.random() * 0.6;
    this.breath = Math.random() * Math.PI;
    this.breathSpeed = 0.02 + Math.random() * 0.03;
  }
  update() {
    this.breath += this.breathSpeed;
    this.alpha = 0.35 + Math.sin(this.breath) * 0.45;

    this.angle += this.speed;
    this.x += Math.cos(this.angle) * 0.3 + this.vx;
    this.y += Math.sin(this.angle * 0.5) * 0.3 + this.vy;

    this.vx *= 0.95;
    this.vy *= 0.95;

    const dx = window.mx - this.x;
    const dy = window.my - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 150) {
      if (window.mouseSpeed < 8) {
        const pull = (150 - dist) / 150;
        this.vx += (dx / dist) * pull * 0.05;
        this.vy += (dy / dist) * pull * 0.05;
      } else {
        const push = (80 - Math.min(dist, 80)) / 80;
        this.vx -= (dx / dist) * push * 0.35;
        this.vy -= (dy / dist) * push * 0.35;
      }
    }

    const limit = 2.0;
    const velocity = Math.hypot(this.vx, this.vy);
    if (velocity > limit) {
      this.vx = (this.vx / velocity) * limit;
      this.vy = (this.vy / velocity) * limit;
    }

    if (this.x < -15) this.x = W + 15;
    if (this.x > W + 15) this.x = -15;
    if (this.y < -15) this.y = H + 15;
    if (this.y > H + 15) this.y = -15;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0.1, this.alpha);
    const cache = this.type === 'gold' ? glowCacheGold : glowCachePink;
    const drawSize = this.size * 6.0;
    ctx.drawImage(cache, this.x - drawSize/2, this.y - drawSize/2, drawSize, drawSize);
    ctx.restore();
  }
}

// ── Confetti ──
class Confetti {
  constructor() {
    this.x = Math.random() * W;
    this.y = -15;
    this.vx = (Math.random() - 0.5) * 4.0;
    this.vy = 3.0 + Math.random() * 4.0;
    this.rot = Math.random() * Math.PI * 2;
    this.rotV = (Math.random() - 0.5) * 0.15;
    this.size = 6 + Math.random() * 8;
    this.color = ['#ffccd9','#ffb3d9','#b3d9ff','#ccb3ff','#ffe6b3','#ff99bb'][Math.floor(Math.random()*6)];
    this.shape = Math.random() < 0.55 ? 'rect' : 'heart';
    this.life = 1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.rotV;
    this.vx *= 0.985;
    if (this.y > H + 20) this.life = 0;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.shape === 'rect') {
      ctx.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
    } else {
      drawHeart(ctx, 0, 0, this.size * 0.65);
    }
    ctx.restore();
  }
}

// Initialize fireflies
for (let i = 0; i < maxFireflies; i++) {
  window.fireflies.push(new Firefly());
}

// ── Mouse & Touch Moves ──
function onMove(x, y) {
  window.mouseSpeed = Math.hypot(x - window.lastMx, y - window.lastMy);
  window.lastMx = x;
  window.lastMy = y;
  window.mx = x;
  window.my = y;

  if (cursorDot) {
    cursorDot.style.left = x + 'px';
    cursorDot.style.top = y + 'px';
    cursorDot.style.transform = 'translate(-50%,-50%) scale(1.15)';
  }

  if (window.isMoving && window.trail.length < maxTrailParticles) {
    for (let i = 0; i < (isMobile ? 1 : 2); i++) {
      window.trail.push(new TrailParticle(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12));
    }
  }

  // Play ambient bell from synthesizer on hover/drag
  if (window.synth && window.synth.isPlaying && window.bellCooldown <= 0) {
    const scaleIndex = Math.floor((x / W) * 8);
    window.synth.playBell(scaleIndex);
    window.bellCooldown = 18; // slightly longer cooldown to reduce audio calls
  }
}

document.addEventListener('mousemove', e => {
  onMove(e.clientX, e.clientY);
});
document.addEventListener('touchmove', e => {
  const t = e.touches[0];
  onMove(t.clientX, t.clientY);
}, { passive: true });

document.addEventListener('mouseleave', () => {
  if (cursorDot) {
    cursorDot.style.transform = 'translate(-50%,-50%) scale(0)';
  }
});

// Expose tap heart spawner
window.spawnTapHeart = function(x, y) {
  const el = document.createElement('div');
  el.className = 'tap-heart';
  el.textContent = ['💗','💖','💝','💕','🌸','✨','🔮','🕊️'][Math.floor(Math.random()*8)];
  el.style.left = (x - 12) + 'px';
  el.style.top = (y - 12) + 'px';
  heartsContainer.appendChild(el);
  setTimeout(() => el.remove(), 1400);
};

// ── Parallax Stars Layer ──
window.drawStarsBg = function() {
  const starCanvas = document.createElement('canvas');
  starCanvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.4';
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  const sc = starCanvas.getContext('2d');
  
  const starCount = isMobile ? 55 : 120;
  
  function fillStars() {
    sc.clearRect(0, 0, starCanvas.width, starCanvas.height);
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * starCanvas.width;
      const y = Math.random() * starCanvas.height;
      const r = Math.random() * 1.4;
      sc.beginPath();
      sc.arc(x, y, r, 0, Math.PI * 2);
      sc.fillStyle = `rgba(255, 230, 245, ${0.35 + Math.random() * 0.65})`;
      sc.fill();
    }
  }

  fillStars();
  document.body.insertBefore(starCanvas, document.body.firstChild);
  
  window.addEventListener('resize', () => {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    fillStars();
  });
};

// ── Main Loop ──
function loop() {
  ctx.clearRect(0, 0, W, H);
  
  if (window.bellCooldown > 0) window.bellCooldown--;

  // 1. Render fireflies in background
  for (let i = 0; i < window.fireflies.length; i++) {
    window.fireflies[i].update();
    window.fireflies[i].draw();
  }

  // 2. Cursor trail
  for (let i = window.trail.length - 1; i >= 0; i--) {
    window.trail[i].update();
    window.trail[i].draw();
    if (window.trail[i].life <= 0) window.trail.splice(i, 1);
  }

  // 3. Floating background hearts
  for (let i = window.floaters.length - 1; i >= 0; i--) {
    window.floaters[i].update();
    window.floaters[i].draw();
    if (window.floaters[i].life <= 0 || window.floaters[i].y < -25) {
      window.floaters.splice(i, 1);
    }
  }

  // Auto spawn background drift hearts
  if (window.floatingActive || window.currentStep === 4) {
    if (Math.random() < window.heartSpawnRate) {
      window.floaters.push(new FloatHeart());
    }
  }

  // 4. Falling Confetti
  for (let i = window.confetti.length - 1; i >= 0; i--) {
    window.confetti[i].update();
    window.confetti[i].draw();
    if (window.confetti[i].life <= 0) window.confetti.splice(i, 1);
  }

  requestAnimationFrame(loop);
}

// Start loop
loop();
