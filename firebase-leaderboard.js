
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD104hdcD_k05SIZQdMymi57_MEFsD-C1c",
    authDomain: "cautio-850d9.firebaseapp.com",
    projectId: "cautio-850d9",
};

// ── Firebase SDK (loaded via CDN in HTML) ────────────────────────────────────
// These globals are available after the Firebase CDN scripts load:
//   firebase, firebase.initializeApp, firebase.firestore

let _db = null;

function _getDb() {
    if (_db) return _db;
    if (!firebase?.apps?.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db = firebase.firestore();
    return _db;
}

const COLLECTION = 'leaderboard';

/**
 * Save or update a player's best score in Firestore.
 * Document ID = lowercase player name (simple, collision-safe enough for a class project).
 */
async function lbSave(name, runnerScore, quizPct, phishPct, level) {
    try {
        const db  = _getDb();
        const ref = db.collection(COLLECTION).doc(name.toLowerCase().trim());
        const snap = await ref.get();

        const existing = snap.exists ? snap.data() : {};
        const entry = {
            name:        name,
            runnerScore: Math.max(runnerScore  || 0, existing.runnerScore  || 0),
            quizPct:     Math.max(quizPct      || 0, existing.quizPct      || 0),
            phishPct:    Math.max(phishPct     || 0, existing.phishPct     || 0),
            level:       level || existing.level || '—',
            updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
        };
        await ref.set(entry);
        console.log('[Cautio LB] Saved:', entry);
    } catch (err) {
        console.warn('[Cautio LB] Save failed (falling back to localStorage):', err);
        _lbLocalSave(name, runnerScore, quizPct, phishPct, level);
    }
}

/**
 * Fetch top 20 players, sorted by composite score.
 * Returns array of entry objects.
 */
async function lbFetch() {
    try {
        const db   = _getDb();
        const snap = await db.collection(COLLECTION)
                             .orderBy('runnerScore', 'desc')
                             .limit(20)
                             .get();
        return snap.docs.map(d => d.data());
    } catch (err) {
        console.warn('[Cautio LB] Fetch failed (falling back to localStorage):', err);
        return _lbLocalGet();
    }
}

/**
 * Clear the entire leaderboard (admin use — called from UI confirm dialog).
 */
async function lbClear() {
    try {
        const db   = _getDb();
        const snap = await db.collection(COLLECTION).get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } catch (err) {
        console.warn('[Cautio LB] Clear failed:', err);
    }
    // Also clear local fallback
    localStorage.removeItem('cautio-leaderboard');
}

// ── localStorage fallback (used if Firebase isn't configured yet) ────────────
const _LB_LOCAL = 'cautio-leaderboard';

function _lbLocalGet() {
    try { return JSON.parse(localStorage.getItem(_LB_LOCAL) || '[]'); }
    catch(e) { return []; }
}

function _lbLocalSave(name, runnerScore, quizPct, phishPct, level) {
    let entries = _lbLocalGet();
    const idx = entries.findIndex(e => (e.name||'').toLowerCase() === name.toLowerCase());
    const entry = {
        name, level,
        runnerScore: runnerScore || 0,
        quizPct:     quizPct    || 0,
        phishPct:    phishPct   || 0,
    };
    if (idx >= 0) {
        entry.runnerScore = Math.max(entry.runnerScore, entries[idx].runnerScore || 0);
        entry.quizPct     = Math.max(entry.quizPct,     entries[idx].quizPct    || 0);
        entry.phishPct    = Math.max(entry.phishPct,    entries[idx].phishPct   || 0);
        entries[idx] = entry;
    } else {
        entries.push(entry);
    }
    entries.sort((a,b) => (b.runnerScore + b.quizPct*10) - (a.runnerScore + a.quizPct*10));
    localStorage.setItem(_LB_LOCAL, JSON.stringify(entries.slice(0,20)));
}

/**
 * Render entries into #leaderboardBody table.
 * Call this from index.html after lbFetch().
 */
function lbRender(entries) {
    const body = document.getElementById('leaderboardBody');
    if (!body) return;
    if (!entries || !entries.length) {
        body.innerHTML = '<tr><td colspan="6" class="leaderboard-empty">No scores yet — play a game to appear here!</td></tr>';
        return;
    }
    // Sort client-side too (Firestore ordered by runnerScore only)
    entries.sort((a,b) => (b.runnerScore + b.quizPct*10 + b.phishPct*5)
                        - (a.runnerScore + a.quizPct*10 + a.phishPct*5));
    const medals = ['🥇','🥈','🥉'];
    const escHtml = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    body.innerHTML = entries.map((e,i) => `
        <tr class="${i < 3 ? 'rank-'+(i+1) : ''}">
            <td>${medals[i] || (i+1)}</td>
            <td>${escHtml(e.name)}</td>
            <td class="lb-score">${Number(e.runnerScore||0).toLocaleString()}</td>
            <td>${e.quizPct||0}%</td>
            <td>${e.phishPct||0}%</td>
            <td>${e.level||'—'}</td>
        </tr>`).join('');
}
