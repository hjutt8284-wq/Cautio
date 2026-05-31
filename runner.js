// CAUTIO — Cyber Road Runner 2026 Edition
'use strict';

const STATES = {
    WAITING:'waiting', RUNNING:'running', STOPPING:'stopping',
    QUESTION:'question', RESULT:'result', RESUMING:'resuming', GAMEOVER:'gameover'
};

const ROAD_STRIPS  = 200;
const CURVE_FORCE  = 160;
const LANE_FRAC    = [-0.34, 0, 0.34];
const ROAD_EDGE    = 0.90;   // hard wall — car cannot cross this

class CyberRoadGame {
    constructor() {
        this.canvas  = document.getElementById('gameCanvas');
        this.ctx     = this.canvas.getContext('2d');
        this.state   = STATES.WAITING;
        this.audioCtx = null;

        this.horizonY  = 0;
        this.roadBaseW = 0;

        // Curve
        this.curve        = 0;
        this.curveTarget  = 0;
        this.curveTimer   = 0;
        this.roadScroll   = 0;

        // Player
        this.playerRoadX  = 0;
        this.playerX      = 0;
        this.playerDepth  = 0.88;  // position along road (0=horizon, 1=camera)
        this.playerVelDepth = 0;
        this.playerJumpY  = 0;
        this.playerVelY   = 0;
        this.playerOnGround = true;
        this.playerTilt   = 0;
        this.playerVelX   = 0;
        this.hitCooldown  = 0;

        // Stats
        this.score   = 0;
        this.lives   = 5;
        this.distance = 0;
        this.speed    = 3;          // starts slow
        this.speedTimer = 0;
        this.speedStage = 0;        // which speed tier we're in
        this.correctAnswers = 0;
        this.totalQuestions = 0;

        // Objects
        this.obstacles    = [];
        this.obstacleTimer = 0;
        this.scenery      = [];
        this.sceneryTimer = 0;
        this.pedestrians  = [];
        this.pedTimer     = 0;
        this.zebraCrossings = [];
        this.zebraTimer   = 0;
        this.bloodPools   = [];
        this.exhaustTrail = [];

        // Signal
        this.signal       = null;
        this.nextSignalAt = 500;
        this.stopProgress = 0;

        // Effects
        this.shakeAmount = 0;
        this.redFlash    = 0;
        this.greenFlash  = 0;
        this.particles   = [];

        // Mouse
        this.mouseX = 0;
        this.mouseY = 0;

        // Question
        this.currentQuestion   = null;
        this.resultCorrect     = false;
        this.resultTimer       = 0;
        this.highlightedAnswer = -1;
        this.answerRects       = [];

        this.questions    = [];
        this.questionPool = [];

        this.keys = {};

        this._stars     = null;
        this._buildings = null;
        this._clouds    = null;

        this.resize();
        this.loadQuestions();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        requestAnimationFrame(() => this.loop());
    }

    // ─── SETUP ───────────────────────────────────────────────────────────────

    resize() {
        this.canvas.width  = this.canvas.parentElement.clientWidth  || 900;
        this.canvas.height = Math.min(600, window.innerHeight - 110);
        this.horizonY   = this.canvas.height * 0.40;
        this.roadBaseW  = this.canvas.width  * 0.80;
        this.playerX    = this.canvas.width  / 2;
        this._stars = null; this._buildings = null; this._clouds = null; // regenerate
    }

    loadQuestions() {
        if (typeof window.runnerQuestions !== 'undefined')
            this.questions = [...window.runnerQuestions];
        this.shufflePool();
    }

    shufflePool() {
        this.questionPool = [...this.questions].sort(() => Math.random() - 0.5);
    }

    getNextQuestion() {
        if (!this.questionPool.length) this.shufflePool();
        const q = this.questionPool.pop();
        const others = this.questions.filter(x => x !== q).sort(() => Math.random() - 0.5);
        const distractors = others.slice(0, 3).map(x => x.correct);
        const ci = Math.floor(Math.random() * 4);
        const choices = []; let d = 0;
        for (let i = 0; i < 4; i++)
            choices.push(i === ci ? { text: q.correct, correct: true }
                                  : { text: distractors[d++] || 'Report it immediately', correct: false });
        return { question: q.question, choices, explanation: q.explanation };
    }

    // ─── INPUT ────────────────────────────────────────────────────────────────

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (this.state === STATES.WAITING)  { startGame(); return; }
            if (this.state === STATES.GAMEOVER) { restartGame(); return; }
            if (this.state === STATES.QUESTION) {
                if (e.code==='Digit1'||e.code==='Numpad1') this.highlightedAnswer=0;
                if (e.code==='Digit2'||e.code==='Numpad2') this.highlightedAnswer=1;
                if (e.code==='Digit3'||e.code==='Numpad3') this.highlightedAnswer=2;
                if (e.code==='Digit4'||e.code==='Numpad4') this.highlightedAnswer=3;
                if (e.code==='ArrowLeft' ||e.code==='KeyA') this.highlightedAnswer=Math.max(0,(this.highlightedAnswer<0?0:this.highlightedAnswer)-1);
                if (e.code==='ArrowRight'||e.code==='KeyD') this.highlightedAnswer=Math.min(3,(this.highlightedAnswer<0?-1:this.highlightedAnswer)+1);
                if ((e.code==='Enter'||e.code==='Space') && this.highlightedAnswer>=0) {
                    this.submitAnswer(this.highlightedAnswer); e.preventDefault();
                }
            }
            if ((e.code==='ArrowUp'||e.code==='ArrowDown') && this.state!==STATES.QUESTION) {
                e.preventDefault(); // prevent page scroll
            }
        });
        document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

        this.canvas.addEventListener('mousemove', (e) => {
            const r = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - r.left) * (this.canvas.width  / r.width);
            this.mouseY = (e.clientY - r.top)  * (this.canvas.height / r.height);
            if (this.state === STATES.QUESTION) {
                let found = false;
                for (const rect of this.answerRects) {
                    if (this.mouseX>=rect.x && this.mouseX<=rect.x+rect.w &&
                        this.mouseY>=rect.y && this.mouseY<=rect.y+rect.h) {
                        this.highlightedAnswer = rect.idx;
                        found = true; break;
                    }
                }
                this.canvas.style.cursor = found ? 'pointer' : 'default';
            } else {
                // Show pointer cursor when hovering over the road during driving
                if ((this.state === STATES.RUNNING || this.state === STATES.RESUMING) &&
                    this.mouseY > this.horizonY) {
                    this.canvas.style.cursor = 'pointer';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const r = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - r.left) * (this.canvas.width  / r.width);
            const my = (e.clientY - r.top)  * (this.canvas.height / r.height);
            if (this.state === STATES.WAITING)  { startGame(); return; }
            if (this.state === STATES.RESULT)   { this.resultTimer=0; return; }
            if (this.state === STATES.QUESTION) { this.handleAnswerClick(mx, my); return; }
            // Lane click during driving — move car to clicked lane
            if ((this.state === STATES.RUNNING || this.state === STATES.RESUMING || this.state === STATES.STOPPING) && my > this.horizonY) {
                this.handleLaneClick(mx);
            }
        });
    }

    // ─── AUDIO ────────────────────────────────────────────────────────────────

    initAudio() {
        if (!this.audioCtx) try { this.audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){}
    }
    playTone(freq, type, dur, gain=0.25) {
        if (!this.audioCtx) return;
        try {
            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.connect(g); g.connect(this.audioCtx.destination);
            o.type=type; o.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            g.gain.setValueAtTime(gain, this.audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime+dur);
            o.start(); o.stop(this.audioCtx.currentTime+dur);
        } catch(e){}
    }
    playCorrect() {
        this.playTone(523,'sine',0.12); setTimeout(()=>this.playTone(659,'sine',0.12),100);
        setTimeout(()=>this.playTone(784,'sine',0.28),200); setTimeout(()=>this.playTone(1047,'sine',0.2),340);
    }
    playWrong() {
        this.playTone(220,'sawtooth',0.3,0.18); setTimeout(()=>this.playTone(160,'sawtooth',0.3,0.18),140);
    }
    playHit() {
        this.playTone(180,'square',0.18,0.35); setTimeout(()=>this.playTone(120,'sawtooth',0.22,0.3),90);
    }
    playEngine() {
        if (!this.audioCtx) return;
        const freq = 60 + this.speed * 4;
        this.playTone(freq, 'sawtooth', 0.05, 0.04);
    }

    // ─── GAME CONTROL ────────────────────────────────────────────────────────

    startGame() {
        this.initAudio();
        this.state=STATES.RUNNING; this.score=0; this.lives=5; this.distance=0;
        this.speed = 3;         // always starts slow
        this.speedStage = 0;
        this.speedTimer=0;
        this.correctAnswers=0; this.totalQuestions=0;
        this.signal=null; this.nextSignalAt=500+Math.random()*300;
        this.obstacles=[]; this.scenery=[]; this.pedestrians=[];
        this.zebraCrossings=[]; this.bloodPools=[]; this.exhaustTrail=[];
        this.particles=[]; this.shakeAmount=0; this.redFlash=0; this.greenFlash=0;
        this.playerRoadX=0; this.playerX=this.canvas.width/2; this.playerVelX=0;
        this.playerDepth=0.88; this.playerVelDepth=0;
        this.playerJumpY=0; this.playerVelY=0; this.playerOnGround=true; this.playerTilt=0;
        this.hitCooldown=0; this.curve=0; this.curveTarget=0; this.curveTimer=0;
        this.roadScroll=0; this.stopProgress=0; this.highlightedAnswer=-1;
        this.shufflePool();
        document.getElementById('gameOver').style.display='none';
        document.getElementById('quizPrompt').style.display='none';
        this.canvas.style.cursor='default';
        this.updateHUD();
    }

    endGame() {
        this.state=STATES.GAMEOVER;
        const distKm = Math.floor(this.distance/60);
        document.getElementById('finalScore').textContent     = this.score;
        document.getElementById('finalDistance').textContent  = distKm+'km';
        document.getElementById('correctAnswers').textContent = `${this.correctAnswers}/${this.totalQuestions}`;
        const best=parseInt(localStorage.getItem('cautio-best')||'0');
        if (this.score>best) localStorage.setItem('cautio-best', this.score);
        localStorage.setItem('cautio-runner-result', JSON.stringify({
            score: this.score, distance: distKm,
            correct: this.correctAnswers, total: this.totalQuestions
        }));
        document.getElementById('promptScore').textContent   = 'Score: ' + this.score;
        document.getElementById('promptAnswers').textContent = `Correct: ${this.correctAnswers}/${this.totalQuestions}`;
        document.getElementById('quizPrompt').style.display = 'flex';
        this.canvas.style.cursor = 'default';
    }

    // ─── MAIN LOOP ────────────────────────────────────────────────────────────

    loop() { this.update(); this.draw(); requestAnimationFrame(()=>this.loop()); }

    update() {
        if (this.state===STATES.WAITING||this.state===STATES.GAMEOVER) return;
        this.shakeAmount*=0.82; this.redFlash*=0.86; this.greenFlash*=0.86;
        this.particles=this.particles.filter(p=>{
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life--; p.alpha=p.life/p.maxLife; return p.life>0;
        });
        this.bloodPools=this.bloodPools.filter(b=>{ b.alpha-=0.0012; return b.alpha>0; });
        if (this.state===STATES.RUNNING)  this.updateRunning();
        if (this.state===STATES.STOPPING) this.updateStopping();
        if (this.state===STATES.RESULT)   this.updateResult();
        if (this.state===STATES.RESUMING) this.updateResuming();
    }

    updateRunning() {
        this.speedTimer++;

        // Progressive speed: increase every 600 frames (~10 seconds), cap at 18
        const speedStages = [3, 4.5, 6, 7.5, 9, 11, 13, 15, 18];
        if (this.speedTimer % 600 === 0 && this.speedStage < speedStages.length - 1) {
            this.speedStage++;
            this.speed = speedStages[this.speedStage];
        }

        this.distance += this.speed;
        this.score    += Math.floor(this.speed * 0.3);
        this.roadScroll += this.speed;
        this.updateCurve();
        this.updatePlayerSteering();
        this.updateObstacles();
        this.updatePedestrians();
        this.updateZebraCrossings();
        this.updateScenery();
        this.updateSignal();
        this.updateHUD();
    }

    updateStopping() {
        this.stopProgress=Math.min(1,this.stopProgress+0.022);
        const sf=1-this.stopProgress;
        this.distance+=this.speed*sf; this.roadScroll+=this.speed*sf;
        this.updateCurve(sf); this.updatePlayerSteering(sf);
        this.updateScenery(sf); this.updatePedestrians(sf);
        if (this.signal) this.signal.depth=Math.min(0.88,this.signal.depth+0.007*sf);
        if (this.stopProgress>=1) {
            this.state=STATES.QUESTION;
            this.currentQuestion=this.getNextQuestion();
            this.totalQuestions++; this.highlightedAnswer=-1;
            this.canvas.style.cursor='default';
        }
        this.updateHUD();
    }

    updateResult() {
        this.resultTimer--;
        if (this.resultTimer<=0) {
            if (this.lives<=0) { this.endGame(); return; }
            this.state=STATES.RESUMING; this.stopProgress=1;
            this.canvas.style.cursor='default';
        }
    }

    updateResuming() {
        this.stopProgress=Math.max(0,this.stopProgress-0.02);
        const sf=1-this.stopProgress;
        this.distance+=this.speed*sf; this.roadScroll+=this.speed*sf;
        this.updateCurve(sf); this.updatePlayerSteering(sf);
        this.updateScenery(sf); this.updatePedestrians(sf);
        if (this.stopProgress<=0) {
            this.state=STATES.RUNNING; this.signal=null;
            this.nextSignalAt=this.distance+500+Math.random()*400;
            this.stopProgress=0;
        }
        this.updateHUD();
    }

    // ─── CURVE ────────────────────────────────────────────────────────────────

    updateCurve(sf=1) {
        this.curveTimer-=sf;
        if (this.curveTimer<=0) {
            this.curveTarget=(Math.random()*2-1)*0.9;
            this.curveTimer=160+Math.random()*220;
        }
        this.curve+=(this.curveTarget-this.curve)*0.016*sf;
    }

    curveOffsetAt(t) { return this.curve*CURVE_FORCE*(1-t); }
    laneScreenX(laneRoadX,t) {
        return this.canvas.width/2 + this.curveOffsetAt(t) + laneRoadX*(this.roadBaseW/2)*t;
    }
    depthToY(t) { return this.horizonY+(this.canvas.height-this.horizonY)*t; }

    // ─── PLAYER STEERING (bounded to road) ───────────────────────────────────

    updatePlayerSteering(sf=1) {
        const W=this.canvas.width;
        const running=this.state===STATES.RUNNING||this.state===STATES.RESUMING;

        // Road curve pulls car laterally
        if (running) this.playerRoadX += this.curve*0.012*sf;

        // ── LEFT / RIGHT steering ──
        const steer = 0.028*sf;
        const maxVX = 0.045;
        if (running) {
            if (this.keys['KeyA']||this.keys['ArrowLeft']) {
                delete this._laneTarget; // cancel click-to-lane when keyboard used
                this.playerVelX = Math.max(-maxVX, this.playerVelX-steer);
                this.playerTilt = -0.28;
            } else if (this.keys['KeyD']||this.keys['ArrowRight']) {
                delete this._laneTarget;
                this.playerVelX = Math.min( maxVX, this.playerVelX+steer);
                this.playerTilt =  0.28;
            } else if (this._laneTarget === undefined) {
                this.playerVelX *= 0.78;
            }
        }
        this.playerTilt *= 0.88;

        // Snap to lane target set by mouse click
        if (this._laneTarget !== undefined) {
            const diff = this._laneTarget - this.playerRoadX;
            if (Math.abs(diff) < 0.012) {
                this.playerRoadX = this._laneTarget;
                this.playerVelX  = 0;
                delete this._laneTarget;
            } else {
                this.playerVelX = Math.sign(diff) * Math.min(0.045, Math.abs(diff) * 0.18);
                this.playerTilt = Math.sign(diff) * 0.28;
            }
        }

        this.playerRoadX += this.playerVelX*sf;

        // ── HARD ROAD BOUNDARY ──
        if (this.playerRoadX > ROAD_EDGE) {
            this.playerRoadX = ROAD_EDGE;
            this.playerVelX  = Math.min(0, this.playerVelX*-0.4);
        }
        if (this.playerRoadX < -ROAD_EDGE) {
            this.playerRoadX = -ROAD_EDGE;
            this.playerVelX  = Math.max(0, this.playerVelX*-0.4);
        }


        // Screen X uses perspective at player's actual depth
        this.playerX = this.laneScreenX(this.playerRoadX, this.playerDepth);
    }

    // ─── OBSTACLES ───────────────────────────────────────────────────────────

    updateObstacles() {
        this.obstacleTimer--;
        const spawnRate=Math.max(22,60-Math.floor(this.speed*2));
        if (this.obstacleTimer<=0) {
            const types=['cone','barrel','car','car','car','truck','police'];
            const lane=LANE_FRAC[Math.floor(Math.random()*3)];
            this.obstacles.push({ laneX:lane,
                type:types[Math.floor(Math.random()*types.length)],
                depth:0.04, hit:false, colorIdx:Math.floor(Math.random()*6),
                animPhase:Math.random()*Math.PI*2 });
            this.obstacleTimer=spawnRate+Math.floor(Math.random()*spawnRate);
        }
        this.obstacles=this.obstacles.filter(o=>{
            o.depth+=(this.speed/320);
            o.animPhase+=0.08;
            if (o.depth>1.1) return false;
            // Collision: depth must be close to player's depth position
            const depthMatch = Math.abs(o.depth - this.playerDepth) < 0.09;
            if (!o.hit && depthMatch && this.state===STATES.RUNNING) {
                const hitW=o.type==='truck'?0.30:o.type==='police'?0.28:0.22;
                if (Math.abs(this.playerRoadX-o.laneX)<hitW) {
                    o.hit=true; this.handleCarHit(o);
                }
            }
            return true;
        });
    }

    handleCarHit(o) {
        if (this.hitCooldown>0) return;
        this.lives--; this.shakeAmount=22; this.redFlash=1;
        this.playHit(); this.updateHUD(); this.hitCooldown=60;
        const hx=this.canvas.width/2+o.laneX*(this.roadBaseW/2);
        this.spawnParticles(hx,this.canvas.height-90,'#ff5500',24);
        this.spawnParticles(hx,this.canvas.height-90,'#ffcc00',14);
        if (this.lives<=0) setTimeout(()=>this.endGame(),500);
    }

    // ─── EXHAUST TRAIL ───────────────────────────────────────────────────────

    updateExhaust() {
        if (this.state!==STATES.RUNNING&&this.state!==STATES.RESUMING) return;
        const px=this.playerX;
        const py=this.depthToY(this.playerDepth);
        this.exhaustTrail.push({ x:px, y:py, alpha:0.55, r:5+Math.random()*4, life:18 });
        this.exhaustTrail=this.exhaustTrail.filter(p=>{ p.alpha-=0.04; p.r+=0.5; p.life--; p.y-=0.8; return p.life>0; });
    }

    // ─── PEDESTRIANS ─────────────────────────────────────────────────────────

    updatePedestrians(sf=1) {
        this.pedTimer-=sf;
        if (this.pedTimer<=0) {
            // Spawn one or two pedestrians, favouring both sides of the road
            const count = Math.random()<0.4 ? 2 : 1;
            const firstSide = Math.random()>0.5 ? 1 : -1;
            for (let i=0; i<count; i++) {
                const side = i===0 ? firstSide : -firstSide;
                const type = Math.random()<0.35 ? 'jogger' : 'walker';
                this.pedestrians.push({ side, type,
                    depth: 0.05+Math.random()*0.12,
                    hasPet: Math.random()<0.5,
                    color: `hsl(${Math.floor(Math.random()*360)},60%,65%)`,
                    phase: Math.random()*Math.PI*2, petPhase: 0 });
            }
            this.pedTimer=10+Math.random()*14;
        }
        this.pedestrians=this.pedestrians.filter(p=>{
            p.depth+=(this.speed/380)*sf;
            p.phase+=(p.type==='jogger'?0.24:0.14)*sf;
            p.petPhase+=0.2*sf;
            return p.depth<1.06;
        });
    }

    updateZebraCrossings() {
        this.zebraTimer--;
        if (this.zebraTimer<=0) {
            const crossers=[];
            const count=3+Math.floor(Math.random()*4);
            for (let i=0;i<count;i++) {
                // Alternate start sides so they cross in both directions
                const ss = i%2===0 ? -1 : 1;
                crossers.push({ roadX:ss*(0.88+Math.random()*0.1), dir:-ss,
                    speed:0.005+Math.random()*0.005,
                    color:`hsl(${Math.floor(Math.random()*360)},60%,65%)`,
                    phase:Math.random()*Math.PI*2, hasPet:Math.random()<0.4, hit:false });
            }
            this.zebraCrossings.push({ depth:0.04, crossers });
            this.zebraTimer=120+Math.floor(Math.random()*100);
        }
        this.zebraCrossings=this.zebraCrossings.filter(z=>{
            z.depth+=(this.speed/350);
            z.crossers.forEach(c=>{ c.roadX+=c.dir*c.speed; c.phase+=0.18; });
            if (z.depth>0.78&&z.depth<1.02&&this.state===STATES.RUNNING) {
                z.crossers.forEach(c=>{
                    if (!c.hit&&Math.abs(this.playerRoadX-c.roadX)<0.22) {
                        c.hit=true; this.handlePedHit(c,z.depth);
                    }
                });
            }
            return z.depth<1.12;
        });
    }

    handlePedHit(crosser,depth) {
        this.lives--; this.shakeAmount=24; this.redFlash=1;
        this.playHit(); this.updateHUD();
        this.bloodPools.push({ rx:crosser.roadX, dy:depth, alpha:0.9, r:20+Math.random()*12 });
        for (let i=0;i<28;i++) {
            const a=Math.random()*Math.PI*2, s=1.5+Math.random()*4.5;
            this.particles.push({ x:this.canvas.width/2+crosser.roadX*(this.roadBaseW/2),
                y:this.depthToY(depth), vx:Math.cos(a)*s, vy:Math.sin(a)*s-2,
                r:2+Math.random()*3, color:'#cc0000', life:45+Math.random()*20, maxLife:65, alpha:1 });
        }
        if (this.lives<=0) setTimeout(()=>this.endGame(),500);
    }

    updateScenery(sf=1) {
        this.sceneryTimer-=sf;
        if (this.sceneryTimer<=0) {
            // Trees bias heavily; spawn on both sides each time
            const types=['tree','tree','tree','tree','flower','bush','billboard','streetlight','pole'];
            const signTexts=['CYBER\nSECURE','PATCH\nNOW','VPN ON','2FA YES','NO CLICK'];
            const firstSide=Math.random()>0.5?1:-1;
            for (const side of [firstSide, -firstSide]) {
                // Occasionally skip one side to avoid perfect symmetry
                if (side!==firstSide && Math.random()<0.25) continue;
                const t=types[Math.floor(Math.random()*types.length)];
                this.scenery.push({ side, depth:0.03+Math.random()*0.02,
                    type: t,
                    color:`hsl(${100+Math.floor(Math.random()*60)},70%,40%)`,
                    flowerColor:`hsl(${Math.floor(Math.random()*360)},90%,65%)`,
                    signText:signTexts[Math.floor(Math.random()*signTexts.length)] });
            }
            this.sceneryTimer=5+Math.random()*6;
        }
        this.scenery=this.scenery.filter(s=>{ s.depth+=(this.speed/420)*sf; return s.depth<1.08; });
    }

    updateSignal() {
        if (!this.signal) {
            if (this.distance>=this.nextSignalAt) this.signal={ depth:0.04, phase:'red' };
            return;
        }
        this.signal.depth=Math.min(0.86,this.signal.depth+0.005);
        if (this.signal.depth>=0.62&&this.state===STATES.RUNNING) {
            this.state=STATES.STOPPING; this.stopProgress=0;
        }
    }

    // ─── DRAW ────────────────────────────────────────────────────────────────

    draw() {
        const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
        const sx=this.shakeAmount>1?(Math.random()-0.5)*this.shakeAmount:0;
        const sy=this.shakeAmount>1?(Math.random()-0.5)*this.shakeAmount*0.3:0;
        ctx.save(); ctx.translate(sx,sy);

        this.drawSky();
        this.drawCityscape();
        this.drawRoad();
        this.drawBloodPools();
        this.drawScenery();
        this.drawPedestrians();
        this.drawZebraCrossings();
        this.drawObstacles();
        if (this.signal) this.drawSignal();
        if (this.state!==STATES.WAITING) {
            this.drawPlayer();
        }
        this.drawParticles();
        this.drawSpeedBlur();

        // Flash overlays
        if (this.redFlash>0.05) {
            ctx.fillStyle=`rgba(220,0,30,${Math.min(0.38,this.redFlash*0.38)})`;
            ctx.fillRect(-sx,-sy,W,H);
        }
        if (this.greenFlash>0.05) {
            ctx.fillStyle=`rgba(0,220,70,${Math.min(0.18,this.greenFlash*0.18)})`;
            ctx.fillRect(-sx,-sy,W,H);
        }
        ctx.restore();

        // UI (no shake)
        this.drawDashboard();
        if (this.state===STATES.QUESTION) this.drawQuestionUI();
        if (this.state===STATES.RESULT)   this.drawResultFeedback();
        if (this.state===STATES.WAITING)  this.drawWaitingScreen();
    }

    // ─── SKY ─────────────────────────────────────────────────────────────────

    drawSky() {
        const ctx=this.ctx, W=this.canvas.width, H=this.horizonY+10;

        // Deep night gradient
        const sky=ctx.createLinearGradient(0,0,0,H);
        sky.addColorStop(0,'#020411');
        sky.addColorStop(0.5,'#070b1e');
        sky.addColorStop(1,'#0e1635');
        ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

        // Stars
        this.drawStars();

        // Moon
        const mx=W*0.82, my=this.horizonY*0.22;
        const moonGlow=ctx.createRadialGradient(mx,my,0,mx,my,45);
        moonGlow.addColorStop(0,'rgba(220,235,255,0.22)');
        moonGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=moonGlow; ctx.beginPath(); ctx.arc(mx,my,45,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#dde8ff'; ctx.beginPath(); ctx.arc(mx,my,14,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#c8d8f0'; ctx.beginPath(); ctx.arc(mx+4,my-3,11,0,Math.PI*2); ctx.fill();

        // Horizon atmosphere glow
        const atm=ctx.createLinearGradient(0,H*0.6,0,H);
        atm.addColorStop(0,'rgba(0,0,0,0)');
        atm.addColorStop(1,'rgba(20,80,200,0.14)');
        ctx.fillStyle=atm; ctx.fillRect(0,0,W,H);

        // Distant clouds (moving)
        this.drawClouds();
    }

    drawStars() {
        if (!this._stars) {
            this._stars=[];
            for (let i=0;i<100;i++)
                this._stars.push({ x:Math.random(), y:Math.random()*0.9, r:Math.random()*1.4+0.2,
                    t:Math.random()*Math.PI*2, speed:0.008+Math.random()*0.025 });
        }
        const ctx=this.ctx, W=this.canvas.width, H=this.horizonY;
        this._stars.forEach(s=>{
            s.t+=s.speed;
            const a=0.3+0.5*Math.abs(Math.sin(s.t));
            ctx.fillStyle=`rgba(200,218,255,${a})`;
            ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2); ctx.fill();
        });
    }

    drawClouds() {
        if (!this._clouds) {
            this._clouds=[];
            for (let i=0;i<6;i++)
                this._clouds.push({ x:Math.random(), y:0.4+Math.random()*0.45,
                    w:0.06+Math.random()*0.12, spd:0.00008+Math.random()*0.00015, alpha:0.04+Math.random()*0.07 });
        }
        const ctx=this.ctx, W=this.canvas.width, H=this.horizonY;
        this._clouds.forEach(c=>{
            c.x=(c.x+c.spd)%1.15;
            ctx.fillStyle=`rgba(160,185,240,${c.alpha})`;
            ctx.beginPath();
            ctx.ellipse(c.x*W, c.y*H, c.w*W, c.w*W*0.32, 0, 0, Math.PI*2);
            ctx.fill();
        });
    }

    // ─── CITYSCAPE ───────────────────────────────────────────────────────────

    drawCityscape() {
        if (!this._buildings) {
            this._buildings=[];
            const W=this.canvas.width;
            const hY=this.horizonY;
            // Generate city buildings
            let x=0;
            while (x<W) {
                const bw=18+Math.random()*40;
                const bh=20+Math.random()*hY*0.85;
                const hue=Math.random()>0.5?220:280;
                this._buildings.push({
                    x, w:bw, h:bh,
                    baseColor:`hsl(${hue},30%,${8+Math.random()*12}%)`,
                    accentColor:`hsl(${hue},80%,${50+Math.random()*30}%)`,
                    windows: Array.from({length:Math.floor(Math.random()*20+5)}, ()=>({
                        wx:Math.random(),wy:Math.random(),on:Math.random()>0.35,
                        col:`hsl(${Math.floor(Math.random()*60+180)},80%,75%)`
                    })),
                    hasAntenna:Math.random()>0.55,
                    hasSign:Math.random()>0.62
                });
                x+=bw+Math.random()*4;
            }
        }

        const ctx=this.ctx, hY=this.horizonY;
        this._buildings.forEach(b=>{
            const by=hY-b.h;
            // Building body
            const grad=ctx.createLinearGradient(b.x,by,b.x+b.w,by);
            grad.addColorStop(0,b.baseColor);
            grad.addColorStop(0.3,`hsl(220,22%,15%)`);
            grad.addColorStop(1,`hsl(230,20%,8%)`);
            ctx.fillStyle=grad;
            ctx.fillRect(b.x,by,b.w,b.h);

            // Neon edge lines
            ctx.strokeStyle=b.accentColor; ctx.lineWidth=1.5;
            ctx.globalAlpha=0.35+0.2*Math.sin(Date.now()/800+b.x);
            ctx.strokeRect(b.x,by,b.w,b.h);
            ctx.globalAlpha=1;

            // Windows
            b.windows.forEach(w=>{
                if (!w.on) return;
                const wx=b.x+w.wx*b.w*0.8+b.w*0.1;
                const wy=by+w.wy*b.h*0.85+b.h*0.1;
                ctx.fillStyle=w.col;
                ctx.shadowColor=w.col; ctx.shadowBlur=4;
                ctx.fillRect(wx,wy,3,4);
                ctx.shadowBlur=0;
            });

            // Rooftop antenna
            if (b.hasAntenna) {
                ctx.strokeStyle='#445566'; ctx.lineWidth=1.2;
                ctx.beginPath(); ctx.moveTo(b.x+b.w/2,by); ctx.lineTo(b.x+b.w/2,by-18); ctx.stroke();
                const blinkOn=Math.sin(Date.now()/500+b.x)>0;
                ctx.fillStyle=blinkOn?'#ff2244':'#441122';
                ctx.shadowColor='#ff2244'; ctx.shadowBlur=blinkOn?8:0;
                ctx.beginPath(); ctx.arc(b.x+b.w/2,by-18,2.5,0,Math.PI*2); ctx.fill();
                ctx.shadowBlur=0;
            }

            // Neon sign
            if (b.hasSign) {
                const signs=['CYBER','NEON','2FA','HACK','VPN','SSL'];
                const signW=b.w*0.75, signH=6;
                const signX=b.x+b.w*0.12, signY=by+b.h*0.2;
                ctx.fillStyle=b.accentColor; ctx.shadowColor=b.accentColor;
                ctx.shadowBlur=12*Math.abs(Math.sin(Date.now()/600+b.x));
                ctx.font=`bold ${Math.max(5,b.w*0.35)}px Orbitron`;
                ctx.textAlign='center'; ctx.fillStyle=b.accentColor;
                ctx.fillText(signs[Math.floor(b.x/30)%signs.length], b.x+b.w/2, signY+signH);
                ctx.shadowBlur=0;
            }
        });
        ctx.textAlign='left';

        // Horizon city glow
        const glow=ctx.createLinearGradient(0,hY*0.6,0,hY);
        glow.addColorStop(0,'rgba(0,0,0,0)');
        glow.addColorStop(1,'rgba(30,60,180,0.18)');
        ctx.fillStyle=glow; ctx.fillRect(0,0,this.canvas.width,hY);
    }

    // ─── ROAD ────────────────────────────────────────────────────────────────

    drawRoad() {
        const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height, N=ROAD_STRIPS;

        // ── Grass/ground drawn FIRST so road strips paint on top ──
        const gr=ctx.createLinearGradient(0,this.horizonY,0,H);
        gr.addColorStop(0,'#0c200c');
        gr.addColorStop(0.5,'#091508');
        gr.addColorStop(1,'#060d06');
        ctx.fillStyle=gr;
        ctx.fillRect(0,this.horizonY,W,H-this.horizonY);

        // Grass texture lines (subtle horizontal bands)
        for (let g=0;g<8;g++) {
            const gy=this.horizonY+(H-this.horizonY)*(g/8);
            ctx.fillStyle=`rgba(0,40,0,${0.06*(g/8)})`;
            ctx.fillRect(0,gy,W,3);
        }

        for (let i=0;i<N;i++) {
            const tn=i/N, tf=(i+1)/N;
            const yn=this.depthToY(tn), yf=this.depthToY(tf);
            const hwn=(this.roadBaseW/2)*tn, hwf=(this.roadBaseW/2)*tf;
            const cxn=W/2+this.curveOffsetAt(tn), cxf=W/2+this.curveOffsetAt(tf);

            // Alternating road shade (asphalt texture feel)
            const scroll=Math.floor((i+this.roadScroll/6)*0.5)%2;
            const base=scroll?'#1a1a1a':'#1e1e1e';

            // Sidewalk shoulders
            const sw=hwn*0.12, swf=hwf*0.12;
            ctx.fillStyle='#2a2520';
            ctx.beginPath();
            ctx.moveTo(cxn-hwn-sw,yn); ctx.lineTo(cxn-hwn,yn);
            ctx.lineTo(cxf-hwf,yf);   ctx.lineTo(cxf-hwf-swf,yf);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cxn+hwn,yn);    ctx.lineTo(cxn+hwn+sw,yn);
            ctx.lineTo(cxf+hwf+swf,yf); ctx.lineTo(cxf+hwf,yf);
            ctx.closePath(); ctx.fill();

            // Main road
            ctx.fillStyle=base;
            ctx.beginPath();
            ctx.moveTo(cxn-hwn,yn); ctx.lineTo(cxn+hwn,yn);
            ctx.lineTo(cxf+hwf,yf); ctx.lineTo(cxf-hwf,yf);
            ctx.closePath(); ctx.fill();

            // Wet road reflection overlay (near camera)
            if (tn>0.55) {
                const refAlpha=(tn-0.55)*0.35;
                const ref=ctx.createLinearGradient(cxn-hwn,yn,cxn+hwn,yn);
                ref.addColorStop(0,'rgba(0,80,200,0)');
                ref.addColorStop(0.3,`rgba(0,80,200,${refAlpha*0.4})`);
                ref.addColorStop(0.5,`rgba(0,180,255,${refAlpha})`);
                ref.addColorStop(0.7,`rgba(0,80,200,${refAlpha*0.4})`);
                ref.addColorStop(1,'rgba(0,80,200,0)');
                ctx.fillStyle=ref;
                ctx.beginPath();
                ctx.moveTo(cxn-hwn,yn); ctx.lineTo(cxn+hwn,yn);
                ctx.lineTo(cxf+hwf,yf); ctx.lineTo(cxf-hwf,yf);
                ctx.closePath(); ctx.fill();
            }

            // Rumble strips (red/white)
            const rw=hwn*0.055, rwf=hwf*0.055;
            ctx.fillStyle=scroll?'#cc2200':'#eeeeee';
            ctx.beginPath(); ctx.moveTo(cxn-hwn-rw,yn); ctx.lineTo(cxn-hwn,yn); ctx.lineTo(cxf-hwf,yf); ctx.lineTo(cxf-hwf-rwf,yf); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cxn+hwn,yn); ctx.lineTo(cxn+hwn+rw,yn); ctx.lineTo(cxf+hwf+rwf,yf); ctx.lineTo(cxf+hwf,yf); ctx.closePath(); ctx.fill();

            // Centre solid yellow line
            const clw=Math.max(0.5,2*tn);
            ctx.fillStyle='#ccaa00';
            ctx.beginPath(); ctx.moveTo(cxn-clw,yn); ctx.lineTo(cxn+clw,yn); ctx.lineTo(cxf+clw,yf); ctx.lineTo(cxf-clw,yf); ctx.fill();

            // Lane dashes (3-lane)
            if (Math.floor((i+this.roadScroll/6)*0.5)%4<3) {
                const lw=Math.max(0.4,1.8*tn);
                ctx.fillStyle='rgba(255,215,0,0.65)';
                for (const lf of [-1/3,1/3]) {
                    const ln=cxn+lf*hwn*2, lff=cxf+lf*hwf*2;
                    ctx.beginPath(); ctx.moveTo(ln-lw,yn); ctx.lineTo(ln+lw,yn);
                    ctx.lineTo(lff+lw,yf); ctx.lineTo(lff-lw,yf); ctx.fill();
                }
            }

            // Edge neon glow (near camera)
            if (i>N*0.86) {
                ctx.save();
                ctx.shadowColor='#00ffff'; ctx.shadowBlur=8;
                ctx.strokeStyle='rgba(0,255,255,0.5)'; ctx.lineWidth=2.5;
                ctx.beginPath(); ctx.moveTo(cxn-hwn,yn); ctx.lineTo(cxf-hwf,yf); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cxn+hwn,yn); ctx.lineTo(cxf+hwf,yf); ctx.stroke();
                ctx.restore();
            }
        }

    }

    // ─── BLOOD POOLS ─────────────────────────────────────────────────────────

    drawBloodPools() {
        const ctx=this.ctx;
        this.bloodPools.forEach(b=>{
            const x=this.laneScreenX(b.rx,Math.min(0.99,b.dy));
            const y=this.depthToY(Math.min(0.99,b.dy));
            const sc=b.dy;
            ctx.globalAlpha=b.alpha;
            ctx.fillStyle='#880000';
            ctx.beginPath(); ctx.ellipse(x,y,b.r*sc*1.6,b.r*sc*0.55,0,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#cc0000';
            ctx.beginPath(); ctx.ellipse(x,y,b.r*sc*0.7,b.r*sc*0.28,0,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='rgba(255,80,80,0.5)';
            ctx.beginPath(); ctx.ellipse(x-b.r*sc*0.2,y,b.r*sc*0.22,b.r*sc*0.1,0,0,Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha=1;
    }

    // ─── SCENERY ─────────────────────────────────────────────────────────────

    drawScenery() {
        const ctx=this.ctx, W=this.canvas.width;
        [...this.scenery].sort((a,b)=>a.depth-b.depth).forEach(s=>{
            const t=s.depth;
            const hw=(this.roadBaseW/2)*t;
            const cx=W/2+this.curveOffsetAt(t);
            const x=cx+s.side*(hw+14*t+10);
            const y=this.depthToY(t);
            const sc=t;

            ctx.save();

            if (s.type==='streetlight') {
                // pole
                ctx.fillStyle='#445566'; ctx.fillRect(x-2.5*sc,y-100*sc,5*sc,100*sc);
                // arm
                ctx.fillRect(x-2.5*sc,y-100*sc, s.side<0?20*sc:-20*sc, 5*sc);
                const lx=x+(s.side<0?18:-18)*sc;
                // lamp housing
                ctx.fillStyle='#334455'; ctx.fillRect(lx-8*sc,y-100*sc,16*sc,8*sc);
                // light cone
                const lg=ctx.createRadialGradient(lx,y-95*sc,0,lx,y-80*sc,30*sc);
                lg.addColorStop(0,'rgba(255,240,180,0.45)');
                lg.addColorStop(1,'rgba(255,240,180,0)');
                ctx.fillStyle=lg; ctx.beginPath(); ctx.ellipse(lx,y-80*sc,30*sc,24*sc,0,0,Math.PI*2); ctx.fill();
                ctx.fillStyle='#ffffcc'; ctx.shadowColor='#ffffa0'; ctx.shadowBlur=14*sc;
                ctx.beginPath(); ctx.arc(lx,y-97*sc,4*sc,0,Math.PI*2); ctx.fill();
                ctx.shadowBlur=0;

            } else if (s.type==='pole') {
                ctx.fillStyle='#556677'; ctx.fillRect(x-3*sc,y-80*sc,6*sc,80*sc);
                ctx.fillStyle='#00ffff'; ctx.shadowColor='#00ffff'; ctx.shadowBlur=10*sc;
                ctx.fillRect(x-14*sc,y-82*sc,28*sc,5*sc); ctx.shadowBlur=0;

            } else if (s.type==='tree') {
                // Shadow
                ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath();
                ctx.ellipse(x+6*sc,y,12*sc,4*sc,0,0,Math.PI*2); ctx.fill();
                // Trunk
                const tg=ctx.createLinearGradient(x-4*sc,0,x+4*sc,0);
                tg.addColorStop(0,'#3d2409'); tg.addColorStop(1,'#5a3515');
                ctx.fillStyle=tg; ctx.fillRect(x-4*sc,y-58*sc,8*sc,32*sc);
                // Foliage layers
                for (let l=0;l<3;l++) {
                    const ly=y-(55+l*22)*sc, lw=(32-l*8)*sc;
                    const fh=`hsl(${115+l*10+Math.sin(s.depth*8+l)*15},${ 65+l*5}%,${30+l*5}%)`;
                    ctx.fillStyle=fh; ctx.shadowColor='rgba(0,100,0,0.3)'; ctx.shadowBlur=5*sc;
                    ctx.beginPath(); ctx.moveTo(x,ly-22*sc); ctx.lineTo(x-lw,ly); ctx.lineTo(x+lw,ly); ctx.closePath(); ctx.fill();
                }
                ctx.shadowBlur=0;

            } else if (s.type==='flower') {
                ctx.fillStyle='#3a7a3a'; ctx.fillRect(x-1.5*sc,y-28*sc,3*sc,18*sc);
                const fr=7*sc;
                ctx.shadowColor=s.flowerColor; ctx.shadowBlur=8*sc;
                for (let p=0;p<6;p++) {
                    const a=p*Math.PI*2/6;
                    ctx.fillStyle=s.flowerColor;
                    ctx.beginPath(); ctx.arc(x+Math.cos(a)*fr*0.72,y-28*sc+Math.sin(a)*fr*0.55,fr*0.45,0,Math.PI*2); ctx.fill();
                }
                ctx.fillStyle='#ffe633'; ctx.beginPath(); ctx.arc(x,y-28*sc,fr*0.38,0,Math.PI*2); ctx.fill();
                ctx.shadowBlur=0;

            } else if (s.type==='bush') {
                ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath();
                ctx.ellipse(x+5*sc,y,14*sc,4*sc,0,0,Math.PI*2); ctx.fill();
                ctx.fillStyle=s.color;
                for (const [bx,by,br] of [[0,-12,15],[-10,-8,10],[10,-8,10],[0,-20,9]]) {
                    ctx.beginPath(); ctx.arc(x+bx*sc,y+by*sc,br*sc,0,Math.PI*2); ctx.fill();
                }

            } else if (s.type==='billboard') {
                const bw=48*sc, bh=30*sc;
                // Pole
                ctx.fillStyle='#334'; ctx.fillRect(x-3*sc,y-bh-50*sc,6*sc,50*sc);
                // Board
                const bb=y-bh-52*sc;
                ctx.fillStyle='#0a0a1a'; ctx.fillRect(x-bw/2,bb,bw,bh);
                ctx.strokeStyle='#00ffff88'; ctx.lineWidth=2*sc;
                ctx.strokeRect(x-bw/2,bb,bw,bh);
                ctx.fillStyle='#00ffff'; ctx.font=`bold ${8*sc}px Orbitron`;
                ctx.textAlign='center';
                ctx.shadowColor='#00ffff'; ctx.shadowBlur=8*sc;
                ctx.fillText(s.signText.split('\n')[0],x,bb+bh*0.45);
                if (s.signText.includes('\n')) {
                    ctx.fillStyle='#aaffdd'; ctx.shadowBlur=4*sc;
                    ctx.fillText(s.signText.split('\n')[1],x,bb+bh*0.78);
                }
                ctx.shadowBlur=0; ctx.textAlign='left';
            }

            ctx.restore();
        });
    }

    // ─── PEDESTRIANS ─────────────────────────────────────────────────────────

    drawPedestrians() {
        const ctx=this.ctx, W=this.canvas.width;
        [...this.pedestrians].sort((a,b)=>a.depth-b.depth).forEach(p=>{
            const t=p.depth;
            const hw=(this.roadBaseW/2)*t;
            const cx=W/2+this.curveOffsetAt(t);
            const x=cx+p.side*(hw+26*t);
            const y=this.depthToY(t);
            this.drawPersonAt(ctx,x,y,t*0.85,p.color,p.phase,p.hasPet,p.petPhase,p.type==='jogger');
        });
    }

    drawPersonAt(ctx,x,y,sc,color,phase,hasPet,petPhase,isJogger) {
        if (sc<0.06) return;
        const sw=isJogger?0.22:0.13;
        const bob=Math.sin(phase)*(isJogger?4:2)*sc;

        // Shadow
        ctx.fillStyle='rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(x,y,9*sc,3*sc,0,0,Math.PI*2); ctx.fill();

        // Legs
        const lleg=Math.sin(phase)*sw, rleg=Math.sin(phase+Math.PI)*sw;
        ctx.fillStyle='#334';
        ctx.fillRect(x-5*sc,y-18*sc+bob,4*sc,18*sc+lleg*16*sc);
        ctx.fillRect(x+1*sc, y-18*sc+bob,4*sc,18*sc+rleg*16*sc);
        // Shoes
        ctx.fillStyle='#222';
        ctx.fillRect(x-6*sc,y-2*sc+bob+lleg*16*sc,7*sc,3*sc);
        ctx.fillRect(x,      y-2*sc+bob+rleg*16*sc,7*sc,3*sc);

        // Body
        const bg=ctx.createLinearGradient(x-6*sc,0,x+6*sc,0);
        bg.addColorStop(0,`hsl(${parseInt(color.match(/\d+/)[0])},50%,35%)`);
        bg.addColorStop(1,color);
        ctx.fillStyle=bg;
        ctx.beginPath(); ctx.roundRect(x-6*sc,y-38*sc+bob,12*sc,20*sc,2*sc); ctx.fill();

        // Arms
        const la=Math.sin(phase+Math.PI)*0.3, ra=Math.sin(phase)*0.3;
        ctx.fillStyle=color;
        ctx.fillRect(x-10*sc,y-36*sc+bob+la*8*sc,4*sc,12*sc);
        ctx.fillRect(x+ 6*sc,y-36*sc+bob+ra*8*sc,4*sc,12*sc);

        // Head
        ctx.fillStyle='#f5c488';
        ctx.beginPath(); ctx.arc(x,y-44*sc+bob,6*sc,0,Math.PI*2); ctx.fill();
        // Hair
        ctx.fillStyle='#442211';
        ctx.beginPath(); ctx.arc(x,y-46*sc+bob,5*sc,Math.PI,Math.PI*2); ctx.fill();

        // Pet
        if (hasPet&&sc>0.16) {
            const px=x+22*sc, py=y;
            const pb=Math.sin(petPhase)*1.5*sc;
            ctx.fillStyle='#cc9944';
            ctx.fillRect(px-6*sc,py-8*sc+pb,14*sc,7*sc);
            ctx.beginPath(); ctx.arc(px+8*sc,py-10*sc+pb,5*sc,0,Math.PI*2); ctx.fill();
            ctx.fillRect(px-4*sc,py-2*sc,3*sc,5*sc); ctx.fillRect(px,py-2*sc,3*sc,5*sc); ctx.fillRect(px+5*sc,py-2*sc,3*sc,5*sc);
            ctx.strokeStyle='#eee'; ctx.lineWidth=Math.max(0.5,sc);
            ctx.beginPath(); ctx.moveTo(x,y-28*sc); ctx.lineTo(px-6*sc,py-5*sc); ctx.stroke();
        }
    }

    // ─── ZEBRA CROSSING ───────────────────────────────────────────────────────

    drawZebraCrossings() {
        const ctx=this.ctx, W=this.canvas.width;
        this.zebraCrossings.forEach(z=>{
            const t=z.depth; if (t<0.05||t>1.04) return;
            const hw=(this.roadBaseW/2)*t;
            const cx=W/2+this.curveOffsetAt(t);
            const y=this.depthToY(t);
            const stripH=Math.max(2,18*t), strips=10;
            for (let s=0;s<strips;s++) {
                if (s%2===0) {
                    ctx.fillStyle='rgba(255,255,255,0.82)';
                    ctx.fillRect(cx-hw+(s/strips)*hw*2, y-stripH/2, hw*2/strips, stripH);
                }
            }
            z.crossers.forEach(c=>{
                if (c.hit) return;
                const cx2=W/2+c.roadX*(this.roadBaseW/2)*t+this.curveOffsetAt(t);
                this.drawPersonAt(ctx,cx2,y,t*0.88,c.color,c.phase,c.hasPet,c.phase,false);
            });
        });
    }

    // ─── OBSTACLES (detailed 3D style) ───────────────────────────────────────

    drawObstacles() {
        const ctx=this.ctx;
        const carColors=['#2255cc','#cc2200','#228833','#cc8800','#991fcc','#00aaaa','#cc0044'];
        [...this.obstacles].sort((a,b)=>a.depth-b.depth).forEach(o=>{
            const t=o.depth; if (t<0.04||t>1.06) return;
            const x=this.laneScreenX(o.laneX,t);
            const y=this.depthToY(t);
            const sc=t;
            ctx.save();

            // Road shadow
            ctx.fillStyle='rgba(0,0,0,0.4)';
            ctx.beginPath(); ctx.ellipse(x,y,26*sc,7*sc,0,0,Math.PI*2); ctx.fill();

            if (o.type==='cone') {
                // Shadow
                ctx.fillStyle='#ff5500';
                ctx.beginPath(); ctx.moveTo(x,y-42*sc); ctx.lineTo(x-16*sc,y); ctx.lineTo(x+16*sc,y); ctx.closePath(); ctx.fill();
                // Light side
                ctx.fillStyle='#ff8844';
                ctx.beginPath(); ctx.moveTo(x,y-42*sc); ctx.lineTo(x,y); ctx.lineTo(x+16*sc,y); ctx.closePath(); ctx.fill();
                // Stripes
                ctx.fillStyle='#fff';
                for (const [fr,wf] of [[0.55,0.44],[0.25,0.22]]) {
                    const sy=y-42*sc*fr, hw=16*sc*fr;
                    ctx.fillRect(x-hw,sy-4*sc*wf,hw*2,3.5*sc*wf);
                }
                // Base
                ctx.fillStyle='#cc3300'; ctx.fillRect(x-16*sc,y-3*sc,32*sc,3*sc);

            } else if (o.type==='barrel') {
                const bw=24*sc, bh=30*sc;
                // Side panel (dark)
                ctx.fillStyle='#8b2200'; ctx.beginPath(); ctx.roundRect(x-bw/2,y-bh,bw,bh,4*sc); ctx.fill();
                // Highlight side
                ctx.fillStyle='#cc3300'; ctx.beginPath(); ctx.roundRect(x,y-bh,bw/2,bh,[0,4*sc,4*sc,0]); ctx.fill();
                // Metal bands
                ctx.fillStyle='#555'; ctx.fillRect(x-bw/2,y-bh*0.68,bw,4*sc); ctx.fillRect(x-bw/2,y-bh*0.36,bw,4*sc);
                ctx.fillStyle='#888'; ctx.fillRect(x-bw/2,y-bh*0.68,bw,2*sc); ctx.fillRect(x-bw/2,y-bh*0.36,bw,2*sc);
                // Biohazard symbol hint
                ctx.fillStyle='#ffcc00'; ctx.font=`bold ${10*sc}px sans-serif`; ctx.textAlign='center';
                ctx.fillText('☢',x,y-bh*0.5+4*sc); ctx.textAlign='left';
                // Top
                ctx.fillStyle='#aa2200'; ctx.beginPath(); ctx.ellipse(x,y-bh,bw/2,bw*0.22,0,0,Math.PI*2); ctx.fill();
                ctx.fillStyle='#cc3300'; ctx.beginPath(); ctx.ellipse(x-2*sc,y-bh-1*sc,bw*0.35,bw*0.16,0,0,Math.PI*2); ctx.fill();

            } else if (o.type==='car' || o.type==='police') {
                const col=o.type==='police'?'#112244':carColors[o.colorIdx%carColors.length];
                const cw=40*sc, ch=24*sc;
                // Body bottom (lower)
                const bg=ctx.createLinearGradient(x-cw/2,y-ch,x+cw/2,y-ch);
                bg.addColorStop(0,this.shadeColor(col,-30));
                bg.addColorStop(0.5,col);
                bg.addColorStop(1,this.shadeColor(col,-20));
                ctx.fillStyle=bg;
                ctx.beginPath(); ctx.roundRect(x-cw/2,y-ch,cw,ch,5*sc); ctx.fill();
                // Roof
                const roofW=cw*0.72, roofH=ch*0.55;
                const rg=ctx.createLinearGradient(x-roofW/2,y-ch-roofH,x+roofW/2,y-ch-roofH);
                rg.addColorStop(0,this.shadeColor(col,-15));
                rg.addColorStop(0.5,this.shadeColor(col,10));
                rg.addColorStop(1,this.shadeColor(col,-10));
                ctx.fillStyle=rg;
                ctx.beginPath(); ctx.roundRect(x-roofW/2,y-ch-roofH,roofW,roofH+2*sc,[6*sc,6*sc,2*sc,2*sc]); ctx.fill();
                // Windshield (blue-tinted glass)
                ctx.fillStyle='rgba(100,160,255,0.35)';
                ctx.beginPath(); ctx.roundRect(x-roofW/2+4*sc,y-ch-roofH+3*sc,roofW*0.52,roofH-4*sc,2*sc); ctx.fill();
                // Rear window
                ctx.fillStyle='rgba(80,140,220,0.3)';
                ctx.beginPath(); ctx.roundRect(x+roofW*0.5*sc,y-ch-roofH+3*sc,roofW*0.44,roofH-4*sc,2*sc); ctx.fill();
                // Windshield highlight
                ctx.fillStyle='rgba(255,255,255,0.18)';
                ctx.beginPath(); ctx.roundRect(x-roofW/2+5*sc,y-ch-roofH+3*sc,roofW*0.25,roofH*0.4,1*sc); ctx.fill();
                // Wheels (4 corners visible)
                ctx.fillStyle='#111';
                for (const [wx,wy] of [[-cw*0.35,0],[cw*0.35,0],[-cw*0.35,-ch+3*sc],[cw*0.35,-ch+3*sc]]) {
                    ctx.beginPath(); ctx.ellipse(x+wx,y+wy,5*sc,3*sc,0,0,Math.PI*2); ctx.fill();
                    ctx.fillStyle='#555'; ctx.beginPath(); ctx.ellipse(x+wx,y+wy,3*sc,2*sc,0,0,Math.PI*2); ctx.fill();
                    ctx.fillStyle='#111';
                }
                // Brake lights
                ctx.fillStyle='#ff3300'; ctx.shadowColor='#ff3300'; ctx.shadowBlur=8*sc;
                ctx.fillRect(x-cw/2+1*sc,y-ch*0.42,7*sc,5*sc); ctx.fillRect(x+cw/2-8*sc,y-ch*0.42,7*sc,5*sc);
                ctx.shadowBlur=0;
                // Headlights
                ctx.fillStyle='#ffffcc'; ctx.shadowColor='#ffffaa'; ctx.shadowBlur=14*sc;
                ctx.fillRect(x-cw/2+1*sc,y-ch+2*sc,7*sc,4*sc); ctx.fillRect(x+cw/2-8*sc,y-ch+2*sc,7*sc,4*sc);
                // Headlight beams
                ctx.globalAlpha=0.08;
                const beam1=ctx.createRadialGradient(x-cw/2,y-ch+4*sc,0,x-cw/2-40*sc,y-ch-60*sc,50*sc);
                beam1.addColorStop(0,'#ffffaa'); beam1.addColorStop(1,'transparent');
                ctx.fillStyle=beam1; ctx.fillRect(x-cw/2-50*sc,y-ch-70*sc,50*sc,70*sc);
                ctx.globalAlpha=1; ctx.shadowBlur=0;
                // Police markings
                if (o.type==='police') {
                    ctx.fillStyle='rgba(255,255,255,0.85)';
                    ctx.fillRect(x-cw/2+2*sc,y-ch*0.7,cw*0.3,ch*0.35);
                    ctx.fillRect(x+cw*0.2,y-ch*0.7,cw*0.3,ch*0.35);
                    // Lightbar
                    const lb=Math.sin(o.animPhase)>0;
                    ctx.fillStyle=lb?'#0044ff':'#222'; ctx.shadowColor=lb?'#0044ff':'none'; ctx.shadowBlur=lb?10*sc:0;
                    ctx.fillRect(x-roofW/2,y-ch-roofH-5*sc,roofW/2,5*sc);
                    ctx.fillStyle=lb?'#222':'#ff0000'; ctx.shadowColor=lb?'none':'#ff0000'; ctx.shadowBlur=lb?0:10*sc;
                    ctx.fillRect(x,y-ch-roofH-5*sc,roofW/2,5*sc);
                    ctx.shadowBlur=0;
                }

            } else if (o.type==='truck') {
                const tw=52*sc, th=36*sc;
                // Cargo
                ctx.fillStyle='#2a3a4a'; ctx.fillRect(x-tw/2,y-th,tw*0.62,th);
                const cg=ctx.createLinearGradient(x-tw/2,0,x-tw/2+tw*0.62,0);
                cg.addColorStop(0,'#1a2a38'); cg.addColorStop(1,'#2a3a4a');
                ctx.fillStyle=cg; ctx.fillRect(x-tw/2,y-th,tw*0.62,th);
                // Cargo highlight
                ctx.fillStyle='rgba(255,255,255,0.06)';
                ctx.fillRect(x-tw/2+2*sc,y-th+2*sc,tw*0.15,th-4*sc);
                // Cab
                const cg2=ctx.createLinearGradient(x-tw/2+tw*0.62,0,x+tw/2,0);
                cg2.addColorStop(0,'#3a5577'); cg2.addColorStop(1,'#4a6688');
                ctx.fillStyle=cg2; ctx.fillRect(x-tw/2+tw*0.62,y-th,tw*0.38,th);
                // Cab window
                ctx.fillStyle='rgba(100,160,255,0.4)';
                ctx.beginPath(); ctx.roundRect(x-tw/2+tw*0.65,y-th+3*sc,tw*0.3,th*0.55,3*sc); ctx.fill();
                // Cab roof
                ctx.fillStyle='#3a5577'; ctx.fillRect(x-tw/2+tw*0.62,y-th,tw*0.38,5*sc);
                // Lights
                ctx.fillStyle='#ff3300'; ctx.shadowColor='#ff3300'; ctx.shadowBlur=8*sc;
                ctx.fillRect(x-tw/2,y-th*0.42,7*sc,5*sc); ctx.fillRect(x+tw/2-7*sc,y-th*0.42,7*sc,5*sc);
                ctx.shadowBlur=0;
                ctx.fillStyle='#ffffaa'; ctx.shadowColor='#ffffaa'; ctx.shadowBlur=12*sc;
                ctx.fillRect(x+tw/2-7*sc,y-th+2*sc,6*sc,4*sc);
                ctx.shadowBlur=0;
                // Exhaust stacks
                ctx.fillStyle='#444'; ctx.fillRect(x-tw/2+tw*0.58,y-th-20*sc,4*sc,22*sc);
                ctx.fillStyle='rgba(150,150,150,0.4)';
                ctx.beginPath(); ctx.arc(x-tw/2+tw*0.60,y-th-22*sc,5*sc,0,Math.PI*2); ctx.fill();
            }

            ctx.restore();
        });
    }

    shadeColor(hex, percent) {
        // Lighten/darken a CSS color by percent
        try {
            const dummy = document.createElement('canvas').getContext('2d');
            dummy.fillStyle = hex;
            dummy.fillRect(0,0,1,1);
            const d = dummy.getImageData(0,0,1,1).data;
            const factor = 1 + percent/100;
            const r=Math.min(255,Math.max(0,Math.round(d[0]*factor)));
            const g=Math.min(255,Math.max(0,Math.round(d[1]*factor)));
            const b=Math.min(255,Math.max(0,Math.round(d[2]*factor)));
            return `rgb(${r},${g},${b})`;
        } catch(e) { return hex; }
    }

    // ─── TRAFFIC SIGNAL ───────────────────────────────────────────────────────

    drawSignal() {
        const ctx=this.ctx;
        const t=this.signal.depth;
        const x=this.canvas.width/2+this.curveOffsetAt(t);
        const y=this.depthToY(t);
        const sc=t;

        // Two poles (gantry)
        const armW=this.roadBaseW*t*0.55;
        ctx.fillStyle='#445566';
        ctx.fillRect(x-armW/2-5*sc,y-180*sc,8*sc,180*sc);
        ctx.fillRect(x+armW/2-3*sc,y-180*sc,8*sc,180*sc);
        // Horizontal arm
        ctx.fillRect(x-armW/2,y-178*sc,armW,7*sc);

        const bw=52*sc, bh=140*sc, bx=x-bw/2, by=y-182*sc-bh;
        // Housing
        const hg=ctx.createLinearGradient(bx,by,bx+bw,by);
        hg.addColorStop(0,'#0a0a0a'); hg.addColorStop(1,'#1a1a1a');
        ctx.fillStyle=hg;
        ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8*sc); ctx.fill();
        ctx.strokeStyle='#333'; ctx.lineWidth=2*sc; ctx.stroke();

        const isGreen=this.state===STATES.RESULT&&this.resultCorrect;
        const isYellow=this.state===STATES.STOPPING&&this.stopProgress<0.55;
        const isRed=!isGreen&&!isYellow||(this.state===STATES.STOPPING&&this.stopProgress>=0.55)||this.state===STATES.QUESTION||(this.state===STATES.RESULT&&!this.resultCorrect);
        const lr=15*sc;

        [[isRed,'#ff2200',22],[isYellow,'#ffaa00',66],[isGreen,'#00ff41',110]].forEach(([on,col,off])=>{
            // Bezel
            ctx.fillStyle='#222';
            ctx.beginPath(); ctx.arc(x,by+off*sc,lr+2*sc,0,Math.PI*2); ctx.fill();
            // Lamp
            ctx.fillStyle=on?col:'#1a1a1a';
            if (on) { ctx.shadowColor=col; ctx.shadowBlur=28*sc; }
            ctx.beginPath(); ctx.arc(x,by+off*sc,lr,0,Math.PI*2); ctx.fill();
            if (on) {
                // highlight
                ctx.fillStyle='rgba(255,255,255,0.35)';
                ctx.beginPath(); ctx.arc(x-lr*0.28,by+off*sc-lr*0.28,lr*0.38,0,Math.PI*2); ctx.fill();
            }
            ctx.shadowBlur=0;
        });
    }

    // ─── EXHAUST ─────────────────────────────────────────────────────────────

    drawExhaust() {
        const ctx=this.ctx;
        this.exhaustTrail.forEach(p=>{
            ctx.globalAlpha=p.alpha*0.4;
            ctx.fillStyle=`hsl(200,40%,${50+p.life*1.5}%)`;
            ctx.beginPath(); ctx.arc(p.x-15,p.y+8,p.r,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x+15,p.y+8,p.r,0,Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha=1;
    }

    // ─── PLAYER CAR (3D perspective from above-behind) ────────────────────────

    drawPlayer() {
        const ctx=this.ctx;
        const W=this.canvas.width, H=this.canvas.height;
        const px=this.playerX;
        // Y position driven by depth (perspective on road)
        const py=this.depthToY(this.playerDepth);
        // Scale car by depth so it shrinks toward horizon, grows near camera
        const carSc = Math.max(0.4, this.playerDepth * 1.12);

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(carSc, carSc);
        ctx.rotate(this.playerTilt*0.18);

        // Ground shadow
        ctx.fillStyle='rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(0, 8, 26, 7, 0, 0, Math.PI*2); ctx.fill();

        // --- Wheels (bottom layer) ---
        const wheelColor='#0a0a0a';
        const rimColor='#888';
        for (const [wx,wy] of [[-16,2],[16,2],[-16,-22],[16,-22]]) {
            ctx.fillStyle=wheelColor;
            ctx.beginPath(); ctx.ellipse(wx,wy,7,5,0,0,Math.PI*2); ctx.fill();
            ctx.fillStyle=rimColor;
            ctx.beginPath(); ctx.ellipse(wx,wy,4,3,0,0,Math.PI*2); ctx.fill();
            // Lug nuts
            ctx.fillStyle='#aaa';
            for (let i=0;i<5;i++) {
                const a=i*Math.PI*2/5;
                ctx.beginPath(); ctx.arc(wx+Math.cos(a)*2.2,wy+Math.sin(a)*1.6,0.8,0,Math.PI*2); ctx.fill();
            }
        }

        // --- Body bottom / chassis ---
        ctx.fillStyle='#001524';
        ctx.beginPath(); ctx.roundRect(-22, -26, 44, 34, 3); ctx.fill();

        // --- Main body ---
        const bodyGrad=ctx.createLinearGradient(-22,-26,22,-26);
        bodyGrad.addColorStop(0,'#005577');
        bodyGrad.addColorStop(0.3,'#00aadd');
        bodyGrad.addColorStop(0.5,'#00ccff');
        bodyGrad.addColorStop(0.7,'#00aadd');
        bodyGrad.addColorStop(1,'#005577');
        ctx.fillStyle=bodyGrad; ctx.shadowColor='#00ffff'; ctx.shadowBlur=16;
        ctx.beginPath(); ctx.roundRect(-21,-30,42,30,5); ctx.fill();
        ctx.shadowBlur=0;

        // --- Body side accent lines ---
        ctx.strokeStyle='rgba(0,255,255,0.5)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(-21,-14); ctx.lineTo(21,-14); ctx.stroke();
        ctx.strokeStyle='rgba(0,255,255,0.25)'; ctx.lineWidth=0.6;
        ctx.beginPath(); ctx.moveTo(-21,-8); ctx.lineTo(21,-8); ctx.stroke();

        // --- Roof / cabin ---
        const roofGrad=ctx.createLinearGradient(-14,-46,14,-46);
        roofGrad.addColorStop(0,'#003344');
        roofGrad.addColorStop(0.5,'#004466');
        roofGrad.addColorStop(1,'#003344');
        ctx.fillStyle=roofGrad;
        ctx.beginPath(); ctx.roundRect(-13,-46,26,18,4); ctx.fill();

        // --- Windshield ---
        ctx.fillStyle='rgba(60,150,255,0.55)';
        ctx.beginPath(); ctx.roundRect(-11,-44,22,14,2); ctx.fill();
        // Windshield reflection
        ctx.fillStyle='rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.roundRect(-10,-43,9,6,1); ctx.fill();

        // --- Rear deck / trunk ---
        ctx.fillStyle='#002233';
        ctx.beginPath(); ctx.roundRect(-21,-12,42,8,2); ctx.fill();

        // --- Headlights (front = top of car in this view) ---
        ctx.fillStyle='#ffffcc'; ctx.shadowColor='#ffffaa'; ctx.shadowBlur=20;
        ctx.beginPath(); ctx.roundRect(-21,-30,9,5,1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(12,-30,9,5,1); ctx.fill();
        ctx.shadowBlur=0;

        // Light beams (faint cones forward)
        ctx.globalAlpha=0.08;
        for (const lx of [-17,17]) {
            const lg=ctx.createRadialGradient(lx,-30,0,lx,-100,60);
            lg.addColorStop(0,'#ffffcc'); lg.addColorStop(1,'transparent');
            ctx.fillStyle=lg;
            ctx.beginPath(); ctx.moveTo(lx,-30); ctx.lineTo(lx-20,-100); ctx.lineTo(lx+20,-100); ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha=1;

        // --- Tail lights (rear = bottom of car) ---
        ctx.fillStyle='#ff2200'; ctx.shadowColor='#ff3300'; ctx.shadowBlur=14;
        ctx.beginPath(); ctx.roundRect(-21,-4,8,4,1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(13,-4,8,4,1); ctx.fill();
        ctx.shadowBlur=0;

        // --- Neon underbody glow ---
        const neon=ctx.createRadialGradient(0,4,0,0,4,26);
        neon.addColorStop(0,'rgba(0,255,200,0.18)');
        neon.addColorStop(1,'rgba(0,255,200,0)');
        ctx.fillStyle=neon; ctx.beginPath(); ctx.ellipse(0,4,28,8,0,0,Math.PI*2); ctx.fill();

        ctx.restore();
    }

    // ─── SPEED BLUR ──────────────────────────────────────────────────────────

    drawSpeedBlur() {
        if (this.speed < 7) return;
        const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
        const intensity = Math.min(0.18, (this.speed-7)*0.018);
        const lg=ctx.createLinearGradient(0,0,W,0);
        lg.addColorStop(0,`rgba(0,20,40,${intensity})`);
        lg.addColorStop(0.08,'transparent');
        lg.addColorStop(0.92,'transparent');
        lg.addColorStop(1,`rgba(0,20,40,${intensity})`);
        ctx.fillStyle=lg; ctx.fillRect(0,0,W,H);
    }

    // ─── PARTICLES ────────────────────────────────────────────────────────────

    drawParticles() {
        const ctx=this.ctx;
        this.particles.forEach(p=>{
            ctx.globalAlpha=Math.max(0,p.alpha);
            ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=6;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha=1; ctx.shadowBlur=0;
    }

    spawnParticles(x,y,color,count) {
        for (let i=0;i<count;i++) {
            const a=Math.random()*Math.PI*2, s=1.5+Math.random()*5;
            this.particles.push({ x,y, vx:Math.cos(a)*s, vy:Math.sin(a)*s-2.5,
                r:2+Math.random()*3.5, color, life:35+Math.random()*28, maxLife:63, alpha:1 });
        }
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────────────

    drawDashboard() {
        const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
        if (this.state===STATES.WAITING||this.state===STATES.GAMEOVER) return;

        const kmh = Math.round(this.speed * 18);
        const pct = Math.min(1, this.speed / 18);
        const speedColor = pct < 0.35 ? "#00ff41" : pct < 0.65 ? "#ffaa00" : pct < 0.88 ? "#ff6600" : "#ff2244";

        ctx.save();
        ctx.fillStyle="rgba(0,5,18,0.80)"; ctx.strokeStyle=speedColor+"55"; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(W-130,H-52,122,44,8); ctx.fill(); ctx.stroke();

        ctx.fillStyle=speedColor; ctx.shadowColor=speedColor; ctx.shadowBlur=10;
        ctx.font="bold 11px Orbitron"; ctx.textAlign="center";
        ctx.fillText("SPEED", W-69, H-34);
        ctx.shadowBlur=0;

        ctx.fillStyle="#ffffff"; ctx.font="bold 15px Orbitron";
        ctx.fillText(kmh+" km/h", W-69, H-16);

        const barX=W-126, barY=H-9, barW=114;
        ctx.fillStyle="rgba(255,255,255,0.1)";
        ctx.beginPath(); ctx.roundRect(barX,barY,barW,4,2); ctx.fill();
        ctx.fillStyle=speedColor; ctx.shadowColor=speedColor; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.roundRect(barX,barY,barW*pct,4,2); ctx.fill();
        ctx.shadowBlur=0;

        if (this.hitCooldown>0) this.hitCooldown--;
        ctx.restore();
    }

    // ─── QUESTION UI (clickable with mouse hover) ─────────────────────────────

    drawQuestionUI() {
        const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
        if (!this.currentQuestion) return;

        // Full overlay
        ctx.fillStyle='rgba(0,0,12,0.92)'; ctx.fillRect(0,0,W,H);

        // Decorative lines
        ctx.strokeStyle='#00ffff22'; ctx.lineWidth=1;
        for (let y=0;y<H;y+=28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

        // Title bar
        const titleH=48;
        const tg=ctx.createLinearGradient(0,0,W,0);
        tg.addColorStop(0,'rgba(0,80,160,0.8)');
        tg.addColorStop(0.5,'rgba(0,140,220,0.9)');
        tg.addColorStop(1,'rgba(0,80,160,0.8)');
        ctx.fillStyle=tg; ctx.fillRect(0,0,W,titleH);
        ctx.strokeStyle='#00ffff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(0,titleH); ctx.lineTo(W,titleH); ctx.stroke();

        ctx.fillStyle='#00ffff'; ctx.shadowColor='#00ffff'; ctx.shadowBlur=15;
        ctx.font=`bold ${Math.min(17,W/42)}px Orbitron`; ctx.textAlign='center';
        ctx.fillText('⚠  CYBER SECURITY ALERT  ⚠', W/2, titleH*0.66);
        ctx.shadowBlur=0;

        // Question box
        const qPad=40, qY=titleH+18, qW=W-qPad*2;
        ctx.fillStyle='rgba(0,20,50,0.7)';
        ctx.beginPath(); ctx.roundRect(qPad,qY,qW,1,0); ctx.fill();

        ctx.fillStyle='#e8f4ff'; ctx.font=`${Math.min(14,W/55)}px Orbitron`; ctx.textAlign='center';
        const qLines=this.wrapText(ctx, this.currentQuestion.question, qW-20);
        qLines.forEach((l,i)=>ctx.fillText(l, W/2, qY+22+i*20));

        // Answer grid
        const cardPad=30;
        const gridY=qY+22+qLines.length*20+20;
        const cardW=(W-cardPad*3)/2;
        const cardH=Math.min(75, (H-gridY-50)/2-12);
        this.answerRects=[];

        this.currentQuestion.choices.forEach((c,i)=>{
            const col=i%2, row=Math.floor(i/2);
            const cx=cardPad+col*(cardW+cardPad);
            const cy=gridY+row*(cardH+12);
            const hover=this.highlightedAnswer===i;
            const isMouseHover = this.mouseX>=cx&&this.mouseX<=cx+cardW&&this.mouseY>=cy&&this.mouseY<=cy+cardH;
            const active = hover||isMouseHover;
            if (isMouseHover&&this.highlightedAnswer!==i) this.highlightedAnswer=i;

            // Card background
            const cg=ctx.createLinearGradient(cx,cy,cx,cy+cardH);
            if (active) {
                cg.addColorStop(0,'rgba(0,140,200,0.45)');
                cg.addColorStop(1,'rgba(0,100,160,0.35)');
            } else {
                cg.addColorStop(0,'rgba(5,15,40,0.85)');
                cg.addColorStop(1,'rgba(3,10,30,0.85)');
            }
            ctx.fillStyle=cg;
            ctx.beginPath(); ctx.roundRect(cx,cy,cardW,cardH,8); ctx.fill();

            // Card border
            ctx.strokeStyle=active?'#00ffcc':'#1a3055';
            ctx.lineWidth=active?2:1;
            if (active) { ctx.shadowColor='#00ffcc'; ctx.shadowBlur=14; }
            ctx.beginPath(); ctx.roundRect(cx,cy,cardW,cardH,8); ctx.stroke();
            ctx.shadowBlur=0;

            // Number badge
            const badgeR=16;
            const bx=cx+26, by=cy+cardH/2;
            ctx.fillStyle=active?'#00ccff':'#0a2040';
            ctx.beginPath(); ctx.arc(bx,by,badgeR,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=active?'#00ffff':'#1a3a5a'; ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.arc(bx,by,badgeR,0,Math.PI*2); ctx.stroke();
            ctx.fillStyle='#fff'; ctx.font=`bold ${Math.min(13,W/60)}px Orbitron`; ctx.textAlign='center';
            ctx.fillText(i+1, bx, by+5);

            // Answer text
            ctx.fillStyle=active?'#00ffee':'#aaccdd';
            ctx.font=`${Math.min(12,W/62)}px Orbitron`; ctx.textAlign='left';
            const maxTW=cardW-badgeR*2-20;
            let txt=c.text;
            while(ctx.measureText(txt).width>maxTW&&txt.length>8) txt=txt.slice(0,-3)+'…';
            ctx.fillText(txt, cx+50, cy+cardH/2+5);

            this.answerRects.push({x:cx,y:cy,w:cardW,h:cardH,idx:i});
        });

        // Instruction
        ctx.fillStyle='rgba(0,180,255,0.4)'; ctx.font=`10px Orbitron`; ctx.textAlign='center';
        ctx.fillText('CLICK ANSWER  |  KEYS 1-4  |  ←/→ then ENTER', W/2, H-14);
    }

    wrapText(ctx, text, maxW) {
        const words=text.split(' '); let line='', lines=[];
        words.forEach(w=>{
            const t=line+w+' ';
            if (ctx.measureText(t).width>maxW&&line) { lines.push(line.trim()); line=w+' '; }
            else line=t;
        });
        lines.push(line.trim()); return lines;
    }

    handleAnswerClick(mx,my) {
        for (const r of this.answerRects) {
            if (mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) {
                this.highlightedAnswer=r.idx; this.submitAnswer(r.idx); return;
            }
        }
    }

    handleLaneClick(mx) {
        // Simple and reliable: divide canvas into 3 zones by screen position of lanes
        const t = this.playerDepth;
        const laneScreenXs = LANE_FRAC.map(lf => this.laneScreenX(lf, t));

        // Find which lane screen zone the click falls in
        // Zone boundaries: between lanes
        const midLeft  = (laneScreenXs[0] + laneScreenXs[1]) / 2;
        const midRight = (laneScreenXs[1] + laneScreenXs[2]) / 2;

        let targetLane;
        if (mx < midLeft)        targetLane = 0; // left lane
        else if (mx < midRight)  targetLane = 1; // centre lane
        else                     targetLane = 2; // right lane

        // Determine current lane index
        let currentLane = 1;
        let minRoadDist = Infinity;
        LANE_FRAC.forEach((lf, i) => {
            const d = Math.abs(this.playerRoadX - lf);
            if (d < minRoadDist) { minRoadDist = d; currentLane = i; }
        });

        // Move ONE lane at a time toward clicked lane
        let newLane = currentLane;
        if (targetLane < currentLane) newLane = currentLane - 1;
        else if (targetLane > currentLane) newLane = currentLane + 1;

        if (newLane !== currentLane) {
            const diff = LANE_FRAC[newLane] - this.playerRoadX;
            this.playerVelX = Math.sign(diff) * 0.045;
            this._laneTarget = LANE_FRAC[newLane];
        }
    }


    submitAnswer(idx) {
        if (this.state!==STATES.QUESTION||!this.currentQuestion) return;
        this.resultCorrect=this.currentQuestion.choices[idx].correct;
        this.state=STATES.RESULT; this.resultTimer=120;
        this.canvas.style.cursor='default';
        if (this.resultCorrect) {
            this.correctAnswers++; this.score+=200;
            if (this.signal) this.signal.phase='green';
            this.greenFlash=1;
            this.spawnParticles(this.canvas.width/2,this.canvas.height-80,'#00ff41',32);
            this.spawnParticles(this.canvas.width/2,this.canvas.height-80,'#00ffcc',18);
            this.playCorrect();
        } else {
            this.lives--; this.shakeAmount=20; this.redFlash=1; this.playWrong();
        }
        this.updateHUD();
    }

    // ─── RESULT FEEDBACK ─────────────────────────────────────────────────────

    drawResultFeedback() {
        const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
        ctx.fillStyle='rgba(0,0,12,0.92)'; ctx.fillRect(0,0,W,H);

        const midY=H*0.38;
        if (this.resultCorrect) {
            // Green correct
            const cg=ctx.createRadialGradient(W/2,midY,0,W/2,midY,180);
            cg.addColorStop(0,'rgba(0,255,100,0.12)');
            cg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);

            ctx.fillStyle='#00ff41'; ctx.shadowColor='#00ff41'; ctx.shadowBlur=30;
            ctx.font=`bold ${Math.min(36,W/22)}px Orbitron`; ctx.textAlign='center';
            ctx.fillText('✓  CORRECT!', W/2, midY); ctx.shadowBlur=0;
            ctx.fillStyle='#00ffcc'; ctx.font=`${Math.min(14,W/55)}px Orbitron`;
            ctx.fillText('+200 POINTS  •  GREAT WORK!', W/2, midY+36);
        } else {
            const rg=ctx.createRadialGradient(W/2,midY,0,W/2,midY,180);
            rg.addColorStop(0,'rgba(255,0,40,0.12)');
            rg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);

            ctx.fillStyle='#ff2244'; ctx.shadowColor='#ff2244'; ctx.shadowBlur=30;
            ctx.font=`bold ${Math.min(36,W/22)}px Orbitron`; ctx.textAlign='center';
            ctx.fillText('✗  WRONG!', W/2, midY); ctx.shadowBlur=0;
            ctx.fillStyle='#ff6677'; ctx.font=`${Math.min(14,W/55)}px Orbitron`;
            ctx.fillText(`-1 LIFE  •  ${this.lives} REMAINING`, W/2, midY+36);
        }

        if (this.currentQuestion) {
            ctx.fillStyle=this.resultCorrect?'#aaffcc':'#ffaacc';
            ctx.font=`${Math.min(11,W/72)}px Orbitron`;
            const lines=this.wrapText(ctx,this.currentQuestion.explanation,W*0.78);
            lines.forEach((l,i)=>ctx.fillText(l,W/2,midY+68+i*16));
        }
        ctx.textAlign='left';
    }

    // ─── WAITING SCREEN ───────────────────────────────────────────────────────

    drawWaitingScreen() {
        const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
        ctx.fillStyle='rgba(0,0,10,0.86)'; ctx.fillRect(0,0,W,H);

        // Scanlines
        ctx.fillStyle='rgba(0,0,0,0.12)';
        for (let y=0;y<H;y+=4) ctx.fillRect(0,y,W,2);

        // Logo
        const pulse=0.8+0.2*Math.abs(Math.sin(Date.now()/600));
        ctx.fillStyle=`rgba(0,255,255,${pulse})`; ctx.shadowColor='#00ffff'; ctx.shadowBlur=30*pulse;
        ctx.font=`bold ${Math.min(56,W/14)}px Orbitron`; ctx.textAlign='center';
        ctx.fillText('CAUTIO', W/2, H*0.28); ctx.shadowBlur=0;

        ctx.fillStyle='#6688aa'; ctx.font=`${Math.min(13,W/55)}px Orbitron`;
        ctx.fillText('CYBER AWARENESS ROAD TRAINING', W/2, H*0.28+46);

        // Info box
        const bx=W/2-180, bw=360, by=H*0.28+70, bh=60;
        ctx.fillStyle='rgba(0,20,50,0.6)'; ctx.strokeStyle='#00ffff22'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#445566'; ctx.font=`${Math.min(11,W/68)}px Orbitron`;
        ctx.fillText('A/D ←/→ Steer   •   Click or Keys 1-4 to Answer Questions', W/2, by+22);
        ctx.fillText('Dodge obstacles  •  Answer questions  •  Spare pedestrians', W/2, by+42);

        // Start prompt
        const p=0.7+0.3*Math.sin(Date.now()/380);
        ctx.fillStyle=`rgba(0,255,190,${p})`; ctx.shadowColor='#00ffbb'; ctx.shadowBlur=18*p;
        ctx.font=`bold ${Math.min(18,W/40)}px Orbitron`;
        ctx.fillText('[ CLICK  OR  PRESS ANY KEY ]', W/2, H*0.28+162);
        ctx.shadowBlur=0; ctx.textAlign='left';
    }

    // ─── HUD ─────────────────────────────────────────────────────────────────

    updateHUD() {
        document.getElementById('score').textContent    = this.score.toLocaleString();
        document.getElementById('distance').textContent = Math.floor(this.distance/60)+'km';
        document.getElementById('size').textContent     = `${this.correctAnswers}/${this.totalQuestions}`;
        document.querySelectorAll('.heart').forEach((h,i)=>h.classList.toggle('lost',i>=this.lives));
    }
}

// ─── GLOBALS ─────────────────────────────────────────────────────────────────
function startGame()   { if (window.game) window.game.startGame(); }
function restartGame() {
    document.getElementById('quizPrompt').style.display = 'none';
    document.getElementById('gameOver').style.display   = 'none';
    if (window.game) window.game.startGame();
}
function goToMenu()  { sessionStorage.setItem('cautio-returning','1'); window.location.href='index.html'; }
function promptYes() { window.location.href='quiz.html'; }
function promptNo()  { window.location.href='results.html'; }

document.addEventListener('DOMContentLoaded', ()=>{
    window.game=new CyberRoadGame();
});
