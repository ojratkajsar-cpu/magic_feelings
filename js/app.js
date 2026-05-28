/* ============================================================
   MAGIC OF FEELINGS — js/app.js
   Application Logic, Event Orchestration, and Mobile Polish
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // --- URL QUERY PERSONALIZATION SYSTEM ---
  const urlParams = new URLSearchParams(window.location.search);
  const paramTo = urlParams.get('to');
  const paramFrom = urlParams.get('from');

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Apply customization
  if (paramTo) {
    const cleanTo = escapeHTML(paramTo);
    document.getElementById('envelope-title').innerHTML = `Для ${cleanTo} ✦`;
    document.getElementById('step1-sub').innerHTML = `Нажми на конверт для ${cleanTo}`;
    
    // Custom final text
    const signature = paramFrom ? `<span class="sender-signature">С любовью, ${escapeHTML(paramFrom)} ✨</span>` : '';
    document.getElementById('final-body').innerHTML = `
      Я так и знал 🌸<br>
      Ты — моя любимая ${cleanTo}.<br>
      Пусть этот день будет таким же тёплым,<br>
      как то, что я чувствую к тебе.
      ${signature}
    `;
  } else if (paramFrom) {
    document.getElementById('final-body').innerHTML = `
      Я так и знал 🌸<br>
      Ты — моя любимая девочка.<br>
      Пусть этот день будет таким же тёплым,<br>
      как то, что я чувствую к тебе.
      <span class="sender-signature">С любовью, ${escapeHTML(paramFrom)} ✨</span>
    `;
  }

  // --- AUDIO CONTROLS INTERACTION ---
  window.isMuted = true;
  const audioToggle = document.getElementById('audio-toggle');
  const muteLine = document.getElementById('mute-line');

  window.toggleAudio = function(forceStart = false) {
    if (!window.synth) return;
    
    if (forceStart) {
      window.isMuted = false;
      audioToggle.classList.remove('muted');
      muteLine.style.display = 'none';
      window.synth.start();
    } else {
      window.isMuted = !window.isMuted;
      if (window.isMuted) {
        audioToggle.classList.add('muted');
        muteLine.style.display = 'block';
        window.synth.stop();
      } else {
        audioToggle.classList.remove('muted');
        muteLine.style.display = 'none';
        window.synth.start();
      }
    }
  };

  audioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    window.toggleAudio();
  });

  // --- STEP SCENE PANELS LOGIC ---
  window.currentStep = 1;
  const bg = document.getElementById('bg');

  window.showStep = function(n) {
    document.querySelectorAll('.scene-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');
    window.currentStep = n;
  };

  // STEP 1: Interactive Envelope Opening Animation
  const envelopeClickable = document.getElementById('envelope-clickable');
  let envelopeOpened = false;

  function openEnvelope() {
    if (envelopeOpened) return;
    envelopeOpened = true;
    
    if (window.isMuted) {
      window.toggleAudio(true); // Automatically start ambient soundscape
    }
    
    if (window.synth && window.synth.isPlaying) {
      window.synth.playBell(1);
      setTimeout(() => window.synth.playBell(3), 200);
      setTimeout(() => window.synth.playBell(5), 400);
    }
    
    envelopeClickable.classList.add('opened');
    
    setTimeout(() => {
      bg.style.background = 'linear-gradient(135deg, #180830 0%, #44145c 50%, #61184a 100%)';
    }, 400);

    setTimeout(() => {
      const step1 = document.getElementById('step1');
      step1.style.transition = 'opacity 0.8s ease';
      step1.style.opacity = '0';
      
      setTimeout(() => {
        window.showStep(2);
        startLetterTextReveal();
      }, 800);
    }, 1600);
  }

  envelopeClickable.addEventListener('click', openEnvelope);

  // STEP 2: Smooth text block entrance + floating hearts on highlight
  function startLetterTextReveal() {
    window.isMoving = true;
    const blocks = document.querySelectorAll('#step2 .text-block');
    
    blocks.forEach((b, i) => {
      setTimeout(() => {
        b.classList.add('visible');
        if (b.classList.contains('highlight')) {
          // Staggered heart spawns over the highlight block
          const r = document.querySelector('.highlight');
          if (r) {
            const count = isMobile ? 6 : 14;
            for (let k = 0; k < count; k++) {
              setTimeout(() => {
                const rect = r.getBoundingClientRect();
                if (window.floaters) {
                  window.floaters.push(new FloatHeart(rect.left + Math.random() * rect.width, rect.top));
                }
              }, k * 120);
            }
          }
        }
      }, 1000 + i * 2200);
    });
    
    setTimeout(() => goToStep3(), 1200 + blocks.length * 2200 + 2500);
  }

  // STEP 3: Climax Screen (Lag-Optimized)
  function goToStep3() {
    window.floatingActive = true;
    bg.style.background = 'linear-gradient(135deg, #2b0622 0%, #520b3e 50%, #300525 100%)';
    window.showStep(3);
    
    setTimeout(() => {
      document.getElementById('love-words').classList.add('visible');
      
      // Spawning wave is staggered beautifully over time to prevent frame drops
      const waveCount = window.maxHeartWave;
      const intervalDelay = isMobile ? 80 : 60;
      
      for (let i = 0; i < waveCount; i++) {
        setTimeout(() => {
          if (window.floaters) {
            window.floaters.push(new FloatHeart(null, null, true));
          }
        }, i * intervalDelay);
      }
    }, 400);
    
    setTimeout(() => goToStep4(), 6400);
  }

  // STEP 4: Final Question / Happy Ending Setup
  function goToStep4() {
    window.floatingActive = false;
    window.showStep(4);
    
    setTimeout(() => {
      document.getElementById('q-text').classList.add('visible');
      setTimeout(() => {
        document.getElementById('btn-yes').classList.add('visible');
        document.getElementById('btn-no').classList.add('visible');
      }, 800);
    }, 600);
  }

  // DYNAMIC EVADING BUTTON SYSTEM (FULL RESPONSIVE TOUCH / DESKTOP SUPPORT)
  const btnNo = document.getElementById('btn-no');

  function evadeButton(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    btnNo.classList.add('evading');
    const pad = 50;
    
    let newX = pad + Math.random() * (window.innerWidth - btnNo.offsetWidth - pad * 2);
    let newY = pad + Math.random() * (window.innerHeight - btnNo.offsetHeight - pad * 2);
    
    const cursorX = e.clientX || (e.touches && e.touches[0].clientX) || window.mx;
    const cursorY = e.clientY || (e.touches && e.touches[0].clientY) || window.my;
    
    // Check if new position is too close to finger/mouse pointer, and offset if needed
    const dist = Math.hypot(newX - cursorX, newY - cursorY);
    if (dist < 140) {
      newX = cursorX > window.innerWidth / 2 ? pad : window.innerWidth - btnNo.offsetWidth - pad;
      newY = cursorY > window.innerHeight / 2 ? pad : window.innerHeight - btnNo.offsetHeight - pad;
    }
    
    btnNo.style.position = 'fixed';
    btnNo.style.left = `${newX}px`;
    btnNo.style.top = `${newY}px`;
    btnNo.style.zIndex = '9999';
    
    const runawayPhrases = [
      "Нет 🥺", 
      "Мимо! 😜", 
      "Подумай еще! 💫", 
      "Неа! 🙈", 
      "Серьезно? 🧐", 
      "Ой, не туда! 🎯", 
      "Почему? 😭", 
      "Все равно люблю 💖", 
      "Не поймаешь! 🌪️",
      "Давай «Да»! 🌸"
    ];
    btnNo.innerText = runawayPhrases[Math.floor(Math.random() * runawayPhrases.length)];
    
    if (window.synth && window.synth.isPlaying) {
      window.synth.playBell(5);
    }
  }

  // Event handlers for evasion
  btnNo.addEventListener('mouseover', evadeButton);
  btnNo.addEventListener('pointerover', evadeButton);
  btnNo.addEventListener('touchstart', evadeButton, { passive: false });
  btnNo.addEventListener('click', evadeButton);

  // YES BUTTON HAPPY ENDING
  document.getElementById('btn-yes').addEventListener('click', () => {
    window.confettiActive = true;
    
    document.getElementById('btn-yes').style.display = 'none';
    btnNo.style.display = 'none';
    document.getElementById('q-text').style.display = 'none';
    
    const fm = document.getElementById('final-message');
    fm.style.display = 'block';
    setTimeout(() => fm.classList.add('visible'), 100);
    
    if (window.synth && window.synth.isPlaying) {
      window.synth.modulateToTriumphant();
    }
    
    // Stagger confetti & climax heart waves to minimize instant CPU spikes
    const confCount = isMobile ? 60 : 180;
    for (let i = 0; i < confCount; i++) {
      setTimeout(() => {
        if (window.confetti) {
          window.confetti.push(new Confetti());
        }
      }, i * 16);
    }
    
    const endHearts = isMobile ? 30 : 90;
    for (let i = 0; i < endHearts; i++) {
      setTimeout(() => {
        if (window.floaters) {
          window.floaters.push(new FloatHeart(null, null, true));
        }
      }, i * 45);
    }
  });

  // GLOBAL TAP INTERACTIONS
  function handleStart(e) {
    if (window.currentStep === 1) return;
    
    const x = e.clientX || (e.touches && e.touches[0].clientX) || window.mx;
    const y = e.clientY || (e.touches && e.touches[0].clientY) || window.my;
    
    if (window.spawnTapHeart) {
      window.spawnTapHeart(x, y);
    }

    // Disperse nearby fireflies
    if (window.fireflies) {
      window.fireflies.forEach(f => {
        const dist = Math.hypot(f.x - x, f.y - y);
        if (dist < 110) {
          const angle = Math.atan2(f.y - y, f.x - x);
          const push = (110 - dist) * 0.1;
          f.vx += Math.cos(angle) * push;
          f.vy += Math.sin(angle) * push;
        }
      });
    }
  }

  document.addEventListener('click', handleStart);
  document.addEventListener('touchstart', e => {
    const t = e.touches[0];
    handleStart({ clientX: t.clientX, clientY: t.clientY });
  }, { passive: true });

  // Initialize parallax background stars
  if (window.drawStarsBg) {
    window.drawStarsBg();
  }

  // Twinkle / hide audio instructions hint after 9 seconds
  setTimeout(() => {
    const audioHint = document.getElementById('audio-hint');
    if (audioHint) audioHint.style.opacity = '0';
  }, 9000);
});
