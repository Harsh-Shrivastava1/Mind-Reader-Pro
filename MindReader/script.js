document.addEventListener("DOMContentLoaded", () => {
    // --- UI ELEMENTS ---
    const e = {
        // Theme
        themeToggle: document.getElementById('theme-toggle'),
        
        // Navigation Logic
        landingView: document.getElementById('landing-view'),
        appView: document.getElementById('app-view'),
        startExpBtn: document.getElementById('start-exp-btn'),
        howBtn: document.getElementById('how-btn'),
        howModal: document.getElementById('how-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        
        // Top Nav
        statusDot: document.getElementById('status-dot'),
        statusText: document.getElementById('status-text'),
        modeBadge: document.getElementById('current-mode-badge'),
        resetBtn: document.getElementById('sys-reset-btn'),
        
        // Config & History
        modeSelect: document.getElementById('mode-select'),
        historyTimeline: document.getElementById('history-timeline'),
        
        // Center Hero
        heroPhaseText: document.getElementById('hero-phase-text'),
        progressIndicator: document.getElementById('step-count'),
        viewIdle: document.getElementById('view-idle'),
        viewSteps: document.getElementById('view-steps'),
        viewLoading: document.getElementById('view-loading'),
        viewReveal: document.getElementById('view-reveal'),
        
        initBtn: document.getElementById('init-btn'),
        stepsList: document.getElementById('steps-list'),
        nextStepBtn: document.getElementById('next-step-btn'),
        inlineInputGroup: document.getElementById('inline-input-group'),
        yInput: document.getElementById('y-input'),
        extractBtn: document.getElementById('extract-btn'),
        errMsg: document.getElementById('err-msg'),
        loaderSubtext: document.getElementById('loader-subtext'),
        revNumber: document.getElementById('rev-number'),
        runAgainBtn: document.getElementById('run-again-btn'),
        
        // Insights
        insightsEmpty: document.getElementById('insights-empty'),
        insightsData: document.getElementById('insights-data'),
        insConf: document.getElementById('ins-conf'),
        confFill: document.getElementById('conf-fill'),
        insEquation: document.getElementById('ins-equation'),
        insN: document.getElementById('ins-n'),
        insDesc: document.getElementById('ins-desc')
    };

    // --- STATE ---
    const state = {
        mode: 'advanced',
        N: null,
        steps: [],
        stepIndex: 0,
        history: []
    };

    // --- THEME TOGGLE ---
    const toggleTheme = () => {
        const body = document.body;
        const icon = document.getElementById('theme-icon');
        if (body.getAttribute('data-theme') === 'dark') {
            body.setAttribute('data-theme', 'light');
            icon.setAttribute('data-feather', 'moon');
        } else {
            body.setAttribute('data-theme', 'dark');
            icon.setAttribute('data-feather', 'sun');
        }
        feather.replace();
    };
    e.themeToggle.addEventListener('click', toggleTheme);

    // --- LANDING TRANSITION ---
    e.startExpBtn.addEventListener('click', () => {
        e.landingView.classList.add('hidden-transition');
        setTimeout(() => {
            e.landingView.classList.add('hidden');
            e.appView.classList.remove('hidden');
            updateTopStatus('IDLE', 'System Ready');
        }, 600);
    });

    e.howBtn.addEventListener('click', () => {
        e.howModal.classList.remove('hidden');
    });

    e.closeModalBtn.addEventListener('click', () => {
        e.howModal.classList.add('hidden');
    });

    e.howModal.addEventListener('click', (ev) => {
        if(ev.target === e.howModal) {
            e.howModal.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && !e.howModal.classList.contains('hidden')) {
            e.howModal.classList.add('hidden');
        }
    });

    // --- HELPER FUNCTIONS ---
    const updateTopStatus = (status, text) => {
        e.statusDot.className = `status-dot ${status}`;
        e.statusText.innerText = `STATUS: ${status}`;
        if(text) e.heroPhaseText.innerText = text;
    };

    const switchHeroView = (targetView) => {
        [e.viewIdle, e.viewSteps, e.viewLoading, e.viewReveal].forEach(v => {
            v.classList.add('hidden-view');
            v.style.position = 'absolute';
        });
        targetView.style.position = 'relative';
        targetView.classList.remove('hidden-view');
    };

    const updateHistory = (result, conf) => {
        state.history.unshift({ result, conf, time: new Date().toLocaleTimeString('en-US', {hour12: false}) });
        if(state.history.length > 5) state.history.pop();
        
        e.historyTimeline.innerHTML = '';
        state.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = `
                <div class="tl-num">${item.result}</div>
                <div class="tl-meta"><span>${item.conf}% Conf</span><span>${item.time}</span></div>
            `;
            e.historyTimeline.appendChild(div);
        });
    };

    // --- PHASE 1: INITIALIZE ---
    e.initBtn.addEventListener('click', async () => {
        state.mode = e.modeSelect.value;
        e.modeBadge.innerText = e.modeSelect.options[e.modeSelect.selectedIndex].text;
        
        e.initBtn.disabled = true;
        e.initBtn.innerHTML = `<div class="premium-loader" style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-right:8px"><svg class="circular-loader" viewBox="25 25 50 50"><circle class="loader-path" cx="50" cy="50" r="20" fill="none" stroke-width="4" stroke="#fff" stroke-miterlimit="10"/></svg></div> Connecting...`;

        try {
            const res = await fetch('/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: state.mode })
            });
            const data = await res.json();
            
            if(data.N) {
                state.N = data.N;
                setupSteps();
                updateTopStatus('PROCESSING', 'Phase 1: Cognitive Processing');
                switchHeroView(e.viewSteps);
                renderStep();
            }
        } catch(err) {
            console.error(err);
            alert("Engine connection failed.");
            e.initBtn.disabled = false;
            e.initBtn.innerHTML = `<i data-feather="zap"></i> Initialize Sequence`;
            feather.replace();
        }
    });

    // --- PHASE 2: PROCESSING (STEPS) ---
    const setupSteps = () => {
        e.stepsList.innerHTML = '';
        e.inlineInputGroup.classList.add('hidden');
        e.nextStepBtn.classList.remove('hidden');
        state.stepIndex = 0;
        
        state.steps = [
            `> Establish a base conceptual numerical seed (x).`,
            `> Apply a deterministic multiplier of 2 (2x).`,
            state.mode === 'basic' ? `> Integrate constant value of ${state.N} to the equation.` : `> Integrate active spatial variable (N = ${state.N}).`,
            `> Halve the entire expression resulting from previous calculations.`
        ];
    };

    const renderStep = () => {
        const div = document.createElement('div');
        div.className = 'step-item';
        div.innerText = state.steps[state.stepIndex];
        e.stepsList.appendChild(div);
        
        // animate in
        setTimeout(() => div.classList.add('active'), 50);

        e.progressIndicator.innerText = `Step ${state.stepIndex + 1} of ${state.steps.length}`;

        if (state.stepIndex === state.steps.length - 1) {
            e.nextStepBtn.classList.add('hidden');
            e.inlineInputGroup.classList.remove('hidden');
            e.yInput.focus();
        }
    };

    e.nextStepBtn.addEventListener('click', () => {
        if (state.stepIndex < state.steps.length - 1) {
            state.stepIndex++;
            renderStep();
        }
    });

    // --- PHASE 3: EXTRACTION ---
    e.extractBtn.addEventListener('click', async () => {
        const val = e.yInput.value.trim();
        if(val === '' || isNaN(val)) {
            e.errMsg.innerText = "Error: Input must be valid number.";
            e.errMsg.classList.remove('hidden');
            return;
        }
        e.errMsg.classList.add('hidden');
        
        updateTopStatus('PROCESSING', 'Phase 2: Data Extraction');
        switchHeroView(e.viewLoading);
        
        // Pseudo processing text updates
        const msg = setInterval(() => {
            const msgs = ["Isolating variables...", "Reversing cognitive flow...", "Validating accuracy vectors...", "Finalizing payload..."];
            e.loaderSubtext.innerText = msgs[Math.floor(Math.random() * msgs.length)];
        }, 800);

        try {
            const res = await fetch('/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ final_result: parseFloat(val), mode: state.mode })
            });
            const data = await res.json();
            
            if(data.error) {
                clearInterval(msg);
                e.errMsg.innerText = data.error;
                e.errMsg.classList.remove('hidden');
                switchHeroView(e.viewSteps);
                return;
            }
            
            // Wait 2s for "processing" feel
            setTimeout(() => {
                clearInterval(msg);
                revealResult(data);
            }, 2000);

        } catch(err) {
            clearInterval(msg);
            alert("Extraction dropped.");
            switchHeroView(e.viewSteps);
        }
    });

    e.yInput.addEventListener('keypress', (ev) => {
        if(ev.key === 'Enter') e.extractBtn.click();
    });

    // --- PHASE 4: RESULT REVEAL ---
    const revealResult = (data) => {
        updateTopStatus('COMPLETE', 'Phase 3: Reconstruction Complete');
        switchHeroView(e.viewReveal);
        
        // Decode effect for number
        let iters = 0;
        const targetStr = String(data.original_number);
        const chars = '0123456789!@#$%^';
        const intv = setInterval(() => {
            e.revNumber.innerText = targetStr.split('').map((c, i) => {
                if(i < iters) return c;
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            if(iters >= targetStr.length) clearInterval(intv);
            iters += 1/4;
        }, 30);

        // Update Insights
        e.insightsEmpty.classList.add('hidden');
        e.insightsData.classList.remove('hidden');
        
        e.insEquation.innerText = state.mode === 'debug' ? `x = (y * 2 - N) / 2` : "x = y - (N/2)";
        e.insN.innerText = data.N_used;
        e.insDesc.innerText = data.explanation;
        
        if (state.mode === 'basic') {
            e.insConf.innerText = "N/A";
            e.confFill.style.width = "0%";
            e.confFill.style.background = "#475569";
        } else {
            e.insConf.innerText = data.confidence + "%";
            // Animate width
            setTimeout(() => {
                e.confFill.style.width = data.confidence + "%";
                e.confFill.style.background = data.confidence > 90 ? "var(--success)" : "var(--warning)";
            }, 500);
        }

        updateHistory(data.original_number, state.mode === 'basic' ? '--' : data.confidence);
    };

    // --- SYSTEM RESET ---
    const resetSystem = () => {
        state.steps = [];
        state.stepIndex = 0;
        state.isDemo = false;
        
        updateTopStatus('IDLE', 'System Idle');
        e.progressIndicator.innerHTML = '<span id="step-count">Standby</span>';
        
        e.yInput.value = '';
        e.stepsList.innerHTML = '';
        
        e.initBtn.disabled = false;
        e.initBtn.innerHTML = `<i data-feather="zap"></i> Initialize Sequence`;
        feather.replace();
        
        switchHeroView(e.viewIdle);
        
        e.insightsData.classList.add('hidden');
        e.insightsEmpty.classList.remove('hidden');
        e.confFill.style.width = "0%";
    };

    e.runAgainBtn.addEventListener('click', resetSystem);
    e.resetBtn.addEventListener('click', () => {
        resetSystem();
        state.history = [];
        e.historyTimeline.innerHTML = `<div class="empty-state"><i data-feather="inbox" class="empty-icon"></i><p>No cognitive reconstructions yet.</p></div>`;
        feather.replace();
    });
});
