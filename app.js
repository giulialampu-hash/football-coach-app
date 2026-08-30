(() => {
  "use strict";

  const STORAGE_KEY = "coachboard:v1";
  const STYLE_KEY = "coachboard:style";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const today = () => new Date().toISOString().slice(0, 10);
  const formatDate = value => new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
  const formatDateTime = value => new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  const duration = training => training.exercises.reduce((sum, exercise) => sum + (Number(exercise.minutes) || 0), 0);

  const demoState = () => ({
    players: [
      { id: "p1", firstName: "Marco", lastName: "Riva" },
      { id: "p2", firstName: "Luca", lastName: "Bassi" },
      { id: "p3", firstName: "Davide", lastName: "Serra" },
      { id: "p4", firstName: "Paolo", lastName: "Conti" },
      { id: "p5", firstName: "Nico", lastName: "Ferri" },
      { id: "p6", firstName: "Elia", lastName: "Fontana" },
      { id: "p7", firstName: "Samir", lastName: "Costa" },
      { id: "p8", firstName: "Andrea", lastName: "Gallo" }
    ],
    board: {
      id: "board-main", title: "Schema gara",
      draftTokens: [
        { id: "t1", playerId: "p1", label: "MR", color: "#b22626", note: "Guida la linea", zone: "board", x: .5, y: .87 },
        { id: "t2", playerId: "p2", label: "LB", color: "#1756a9", note: "", zone: "board", x: .22, y: .66 },
        { id: "t3", playerId: "p3", label: "DS", color: "#1756a9", note: "Stringe in possesso", zone: "board", x: .5, y: .63 },
        { id: "t4", playerId: "p4", label: "PC", color: "#1756a9", note: "", zone: "board", x: .78, y: .66 },
        { id: "t5", playerId: "p5", label: "NF", color: "#e3a008", note: "Tra le linee", zone: "board", x: .5, y: .37 },
        { id: "t6", playerId: "p6", label: "EF", color: "#e3a008", note: "", zone: "board", x: .28, y: .24 },
        { id: "t7", playerId: "p7", label: "SC", color: "#e3a008", note: "Attacca profondità", zone: "board", x: .71, y: .2 },
        { id: "t8", playerId: "p8", label: "AG", color: "#6f3ca0", note: "", zone: "reserve", x: .3, y: .62 }
      ],
      revisions: []
    },
    trainings: [
      { id: "tr1", title: "Uscita dal basso", date: "2026-08-31", notes: "Progressione: analitico, situazionale, partita.", exercises: [{ id: "e1", label: "Rondo 5 contro 2", minutes: 15 }, { id: "e2", label: "Costruzione 7 contro 5", minutes: 25 }, { id: "e3", label: "Partita a tema", minutes: 30 }] },
      { id: "tr2", title: "Pressione e riaggressione", date: "2026-09-03", notes: "Alta intensità, recuperi completi.", exercises: [{ id: "e4", label: "Attivazione a coppie", minutes: 10 }, { id: "e5", label: "Gioco di posizione", minutes: 25 }, { id: "e6", label: "Partita libera", minutes: 25 }] }
    ]
  });

  let memoryStore = null;
  let state = loadState();
  let currentView = "home";
  let trainingQuery = "";
  let undoStack = [];
  let redoStack = [];
  let drag = null;
  let selfCheckResult = null;

  function validState(value) {
    return value && Array.isArray(value.players) && value.board && Array.isArray(value.board.draftTokens) && Array.isArray(value.board.revisions) && Array.isArray(value.trainings);
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (validState(parsed)) return parsed;
    } catch (_) { /* memory fallback */ }
    return memoryStore && validState(memoryStore) ? clone(memoryStore) : demoState();
  }

  function persist(message = "Bozza salvata") {
    memoryStore = clone(state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* memory fallback */ }
    const status = $("#save-status");
    if (status) {
      status.textContent = message;
      clearTimeout(persist.timer);
      persist.timer = setTimeout(() => { status.textContent = "Tutto salvato"; }, 1200);
    }
  }

  function pushUndo(before) {
    undoStack.push(clone(before));
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
  }

  function commitTokens(before, message) {
    if (JSON.stringify(before) === JSON.stringify(state.board.draftTokens)) return;
    pushUndo(before);
    persist(message);
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(clone(state.board.draftTokens));
    state.board.draftTokens = undoStack.pop();
    persist("Modifica annullata");
    render();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(clone(state.board.draftTokens));
    state.board.draftTokens = redoStack.pop();
    persist("Modifica ripristinata");
    render();
  }

  const playerName = id => {
    const player = state.players.find(item => item.id === id);
    return player ? `${player.firstName} ${player.lastName}` : "Giocatore non collegato";
  };

  function showView(view) {
    if (!["home", "board", "team", "training"].includes(view)) return;
    currentView = view;
    render();
    $("#app").focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function render() {
    const views = { home: renderHome, board: renderBoard, team: renderTeam, training: renderTraining };
    $("#app").innerHTML = `${selfCheckResult ? `<div class="test-report ${selfCheckResult.ok ? "" : "fail"}" role="status"><strong>Self-check: ${selfCheckResult.ok ? "superato" : "fallito"}</strong>${selfCheckResult.error ? `<br>${escapeHtml(selfCheckResult.error)}` : " — serializzazione, snapshot, coordinate e durata verificati."}</div>` : ""}${views[currentView]()}`;
    $$("[data-view]").forEach(button => {
      if (button.closest(".main-nav")) button.toggleAttribute("aria-current", button.dataset.view === currentView);
    });
  }

  function renderHome() {
    const next = [...state.trainings].sort((a, b) => a.date.localeCompare(b.date))[0];
    return `<section class="hero"><p class="eyebrow">Piano di lavoro</p><h1>Buon lavoro, mister.</h1><p>Squadra, schemi e sedute in un solo posto. La bozza viene salvata mentre lavori.</p></section>
      <section class="card-grid" aria-label="Aree principali">
        <button class="feature-card" data-view="board"><span class="card-index">01 · CAMPO</span><h2>Lavagnetta</h2><p>Prepara disposizioni e conserva versioni.</p></button>
        <button class="feature-card" data-view="team"><span class="card-index">02 · GRUPPO</span><h2>Squadra</h2><p>${state.players.length} giocatori disponibili.</p></button>
        <button class="feature-card" data-view="training"><span class="card-index">03 · LAVORO</span><h2>Allenamenti</h2><p>${next ? `Prossimo: ${formatDate(next.date)}` : "Nessuna seduta pianificata."}</p></button>
      </section>
      <section class="stat-row" aria-label="Riepilogo"><div class="stat"><strong>${state.board.draftTokens.filter(t => t.zone === "board").length}</strong><span>in campo</span></div><div class="stat"><strong>${state.board.revisions.length}</strong><span>versioni</span></div><div class="stat"><strong>${state.trainings.length}</strong><span>sedute</span></div></section>`;
  }

  function tokenHtml(token) {
    const name = playerName(token.playerId);
    return `<button type="button" class="token ${token.note ? "has-note" : ""}" data-token-id="${escapeHtml(token.id)}" style="left:${clamp(token.x) * 100}%;top:${clamp(token.y) * 100}%;--token-color:${escapeHtml(token.color)}" aria-label="${escapeHtml(token.label || name)}. ${escapeHtml(name)}. Trascina o usa frecce; Invio per modificare." title="${escapeHtml(name)}">${escapeHtml(token.label || name.split(" ").map(part => part[0]).join("").slice(0, 2))}</button>`;
  }

  function revisionHtml(revision) {
    const dots = revision.tokens.filter(token => token.zone === "board").map(token => `<i class="mini-dot" style="left:${clamp(token.x) * 100}%;top:${clamp(token.y) * 100}%;--dot:${escapeHtml(token.color)}"></i>`).join("");
    return `<li class="history-item"><div class="mini-pitch" aria-hidden="true">${dots}</div><div><strong>${escapeHtml(revision.name)}</strong><small>${formatDateTime(revision.createdAt)}</small><button type="button" data-restore="${escapeHtml(revision.id)}">Ripristina</button></div></li>`;
  }

  function renderBoard() {
    const boardTokens = state.board.draftTokens.filter(token => token.zone === "board").map(tokenHtml).join("");
    const reserveTokens = state.board.draftTokens.filter(token => token.zone === "reserve").map(tokenHtml).join("");
    return `<div class="section-head"><div><p class="eyebrow">Lavagnetta</p><h1>${escapeHtml(state.board.title)}</h1></div><div class="button-row"><button type="button" class="quiet" data-undo ${undoStack.length ? "" : "disabled"}>Annulla</button><button type="button" class="quiet" data-redo ${redoStack.length ? "" : "disabled"}>Ripeti</button></div></div>
      <div class="board-layout"><section class="tactics" aria-label="Disposizione corrente"><div class="pitch" data-zone="board">${boardTokens}</div><div class="reserve-box" data-zone="reserve"><h2>Riserve</h2>${reserveTokens}</div></section>
      <aside class="board-side"><div class="panel"><h2>Azioni</h2><div class="button-row"><button type="button" data-add-token>+ Pallino</button><button type="button" class="quiet" data-save-snapshot>Salva posizione</button></div><p class="muted"><small>Trascina i pallini. Tastiera: frecce 1%, Maiusc + frecce 5%, Invio modifica.</small></p></div>
      <div class="panel"><h2>Cronologia</h2>${state.board.revisions.length ? `<ol class="history-list">${[...state.board.revisions].reverse().map(revisionHtml).join("")}</ol>` : `<div class="empty">Nessuna posizione salvata.</div>`}</div></aside></div>`;
  }

  function renderTeam() {
    const people = state.players.map(player => `<li class="person"><span class="avatar" aria-hidden="true">${escapeHtml(player.firstName[0] + player.lastName[0])}</span><span><strong>${escapeHtml(player.firstName)} ${escapeHtml(player.lastName)}</strong><small>${state.board.draftTokens.filter(token => token.playerId === player.id).length ? "Presente in lavagnetta" : "Non schierato"}</small></span><span class="person-actions"><button type="button" class="quiet" data-edit-player="${player.id}" aria-label="Modifica ${escapeHtml(player.firstName)} ${escapeHtml(player.lastName)}">✎</button><button type="button" class="danger" data-delete-player="${player.id}" aria-label="Rimuovi ${escapeHtml(player.firstName)} ${escapeHtml(player.lastName)}">×</button></span></li>`).join("");
    return `<div class="section-head"><div><p class="eyebrow">Rosa</p><h1>Squadra</h1></div><button type="button" data-add-player>+ Giocatore</button></div><ul class="list person-list">${people || `<li class="empty">Nessun giocatore.</li>`}</ul>`;
  }

  function renderTraining() {
    const query = trainingQuery.trim().toLocaleLowerCase("it");
    const filtered = state.trainings.filter(training => [training.title, training.notes, training.date, formatDate(training.date), ...training.exercises.map(exercise => exercise.label)].join(" ").toLocaleLowerCase("it").includes(query)).sort((a, b) => b.date.localeCompare(a.date));
    const cards = filtered.map(training => `<article class="training-card"><div><h2>${escapeHtml(training.title)}</h2><div class="training-meta"><span>${formatDate(training.date)}</span><strong>${duration(training)} min</strong></div>${training.notes ? `<p>${escapeHtml(training.notes)}</p>` : ""}<div class="exercise-chips">${training.exercises.map(exercise => `<span class="chip">${escapeHtml(exercise.label)} · ${Number(exercise.minutes) || 0} min</span>`).join("")}</div></div><span class="person-actions"><button type="button" class="quiet" data-edit-training="${training.id}" aria-label="Modifica ${escapeHtml(training.title)}">✎</button><button type="button" class="danger" data-delete-training="${training.id}" aria-label="Elimina ${escapeHtml(training.title)}">×</button></span></article>`).join("");
    return `<div class="section-head"><div><p class="eyebrow">Programmazione</p><h1>Allenamenti</h1></div><button type="button" data-add-training>+ Seduta</button></div><label><span class="muted">Cerca per titolo, data, note o esercizio</span><input class="search" type="search" value="${escapeHtml(trainingQuery)}" placeholder="Cerca allenamenti…" data-training-search></label><div class="training-list" style="margin-top:1rem">${cards || `<div class="empty">Nessun allenamento trovato.</div>`}</div>`;
  }

  function openToken(id) {
    const dialog = $("#token-dialog");
    const form = $("#token-form");
    const token = state.board.draftTokens.find(item => item.id === id) || { id: "", playerId: state.players[0]?.id || "", label: "", color: "#1756a9", note: "", zone: "board" };
    form.elements.id.value = token.id;
    form.elements.playerId.innerHTML = `<option value="">Nessun collegamento</option>${state.players.map(player => `<option value="${player.id}">${escapeHtml(player.firstName)} ${escapeHtml(player.lastName)}</option>`).join("")}`;
    form.elements.playerId.value = token.playerId || "";
    form.elements.label.value = token.label;
    form.elements.color.value = token.color;
    form.elements.note.value = token.note;
    form.elements.zone.value = token.zone;
    $("[data-delete-token]", form).hidden = !token.id;
    dialog.showModal();
  }

  function openPlayer(id) {
    const form = $("#player-form");
    const player = state.players.find(item => item.id === id) || { id: "", firstName: "", lastName: "" };
    form.elements.id.value = player.id;
    form.elements.firstName.value = player.firstName;
    form.elements.lastName.value = player.lastName;
    $("#player-dialog").showModal();
  }

  function exerciseRow(exercise = { id: uid("e"), label: "", minutes: 10 }) {
    return `<div class="exercise-row" data-exercise-id="${escapeHtml(exercise.id)}"><input name="exerciseLabel" required maxlength="100" value="${escapeHtml(exercise.label)}" aria-label="Nome esercizio" placeholder="Esercizio"><input name="exerciseMinutes" type="number" min="0" max="999" required value="${Number(exercise.minutes) || 0}" aria-label="Minuti"><button type="button" class="danger" data-remove-exercise aria-label="Rimuovi esercizio">×</button></div>`;
  }

  function openTraining(id) {
    const form = $("#training-form");
    const training = state.trainings.find(item => item.id === id) || { id: "", title: "", date: today(), notes: "", exercises: [{ id: uid("e"), label: "", minutes: 10 }] };
    form.elements.id.value = training.id;
    form.elements.title.value = training.title;
    form.elements.date.value = training.date;
    form.elements.notes.value = training.notes;
    $("#exercise-fields").innerHTML = training.exercises.map(exerciseRow).join("");
    $("#training-dialog").showModal();
  }

  function handleBoardPointerDown(event) {
    const tokenElement = event.target.closest("[data-token-id]");
    if (!tokenElement || event.button !== 0) return;
    const token = state.board.draftTokens.find(item => item.id === tokenElement.dataset.tokenId);
    const zone = tokenElement.closest("[data-zone]");
    drag = { token, element: tokenElement, zone, before: clone(state.board.draftTokens), moved: false };
    tokenElement.setPointerCapture(event.pointerId);
    tokenElement.classList.add("dragging");
    event.preventDefault();
  }

  function handleBoardPointerMove(event) {
    if (!drag) return;
    const rect = drag.zone.getBoundingClientRect();
    drag.token.x = clamp((event.clientX - rect.left) / rect.width);
    drag.token.y = clamp((event.clientY - rect.top) / rect.height);
    drag.element.style.left = `${drag.token.x * 100}%`;
    drag.element.style.top = `${drag.token.y * 100}%`;
    drag.moved = true;
  }

  function handleBoardPointerUp() {
    if (!drag) return;
    drag.element.classList.remove("dragging");
    const moved = drag.moved;
    if (moved) commitTokens(drag.before, "Posizione salvata");
    drag = null;
    if (moved) render();
  }

  function handleTokenKey(event) {
    const target = event.target.closest("[data-token-id]");
    if (!target) return;
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openToken(target.dataset.tokenId); return; }
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[event.key]) return;
    event.preventDefault();
    const before = clone(state.board.draftTokens);
    const token = state.board.draftTokens.find(item => item.id === target.dataset.tokenId);
    const step = event.shiftKey ? .05 : .01;
    token.x = clamp(token.x + directions[event.key][0] * step);
    token.y = clamp(token.y + directions[event.key][1] * step);
    commitTokens(before, "Posizione salvata");
    render();
    $(`[data-token-id="${CSS.escape(token.id)}"]`)?.focus();
  }

  document.addEventListener("click", event => {
    const view = event.target.closest("[data-view]")?.dataset.view;
    if (view) return showView(view);
    if (event.target.closest("[data-undo]")) return undo();
    if (event.target.closest("[data-redo]")) return redo();
    if (event.target.closest("[data-add-token]")) return openToken();
    if (event.target.closest("[data-save-snapshot]")) { $("#snapshot-form").reset(); return $("#snapshot-dialog").showModal(); }
    const token = event.target.closest("[data-token-id]");
    if (token && !drag) return openToken(token.dataset.tokenId);
    const restoreId = event.target.closest("[data-restore]")?.dataset.restore;
    if (restoreId) {
      const revision = state.board.revisions.find(item => item.id === restoreId);
      if (!revision) return;
      const before = clone(state.board.draftTokens);
      state.board.draftTokens = clone(revision.tokens);
      commitTokens(before, "Versione caricata come bozza");
      return render();
    }
    if (event.target.closest("[data-add-player]")) return openPlayer();
    const editPlayer = event.target.closest("[data-edit-player]")?.dataset.editPlayer;
    if (editPlayer) return openPlayer(editPlayer);
    const deletePlayer = event.target.closest("[data-delete-player]")?.dataset.deletePlayer;
    if (deletePlayer && confirm("Rimuovere il giocatore? I pallini correnti resteranno senza collegamento; le versioni salvate non cambiano.")) {
      state.players = state.players.filter(player => player.id !== deletePlayer);
      state.board.draftTokens.forEach(item => { if (item.playerId === deletePlayer) item.playerId = null; });
      persist("Giocatore rimosso"); return render();
    }
    if (event.target.closest("[data-add-training]")) return openTraining();
    const editTraining = event.target.closest("[data-edit-training]")?.dataset.editTraining;
    if (editTraining) return openTraining(editTraining);
    const deleteTraining = event.target.closest("[data-delete-training]")?.dataset.deleteTraining;
    if (deleteTraining && confirm("Eliminare questo allenamento?")) { state.trainings = state.trainings.filter(item => item.id !== deleteTraining); persist("Allenamento eliminato"); return render(); }
    if (event.target.closest("[data-add-exercise]")) return $("#exercise-fields").insertAdjacentHTML("beforeend", exerciseRow());
    const removeExercise = event.target.closest("[data-remove-exercise]");
    if (removeExercise && $$(".exercise-row").length > 1) return removeExercise.closest(".exercise-row").remove();
    if (event.target.closest("[data-delete-token]")) {
      const id = $("#token-form").elements.id.value;
      const before = clone(state.board.draftTokens);
      state.board.draftTokens = state.board.draftTokens.filter(item => item.id !== id);
      commitTokens(before, "Pallino eliminato"); $("#token-dialog").close(); return render();
    }
    const close = event.target.closest("[data-close]");
    if (close) return close.closest("dialog").close();
  });

  document.addEventListener("input", event => {
    if (!event.target.matches("[data-training-search]")) return;
    trainingQuery = event.target.value;
    const position = event.target.selectionStart;
    render();
    const input = $("[data-training-search]");
    input.focus(); input.setSelectionRange(position, position);
  });

  document.addEventListener("pointerdown", handleBoardPointerDown);
  document.addEventListener("pointermove", handleBoardPointerMove);
  document.addEventListener("pointerup", handleBoardPointerUp);
  document.addEventListener("pointercancel", handleBoardPointerUp);
  document.addEventListener("keydown", handleTokenKey);

  $("#token-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const before = clone(state.board.draftTokens);
    let token = state.board.draftTokens.find(item => item.id === data.get("id"));
    if (!token) {
      token = { id: uid("t"), playerId: "", label: "", color: "#1756a9", note: "", zone: "board", x: .5, y: .5 };
      state.board.draftTokens.push(token);
    }
    const oldZone = token.zone;
    Object.assign(token, { playerId: data.get("playerId") || null, label: data.get("label").trim(), color: data.get("color"), note: data.get("note").trim(), zone: data.get("zone") });
    if (oldZone !== token.zone) { token.x = .5; token.y = .5; }
    commitTokens(before, "Pallino salvato"); event.currentTarget.closest("dialog").close(); render();
  });

  $("#player-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = data.get("id");
    const player = state.players.find(item => item.id === id);
    const value = { id: id || uid("p"), firstName: data.get("firstName").trim(), lastName: data.get("lastName").trim() };
    player ? Object.assign(player, value) : state.players.push(value);
    persist("Squadra salvata"); event.currentTarget.closest("dialog").close(); render();
  });

  $("#training-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = data.get("id");
    const rows = $$(".exercise-row", event.currentTarget);
    const value = { id: id || uid("tr"), title: data.get("title").trim(), date: data.get("date"), notes: data.get("notes").trim(), exercises: rows.map(row => ({ id: row.dataset.exerciseId, label: $("[name=exerciseLabel]", row).value.trim(), minutes: Math.max(0, Number($("[name=exerciseMinutes]", row).value) || 0) })) };
    const training = state.trainings.find(item => item.id === id);
    training ? Object.assign(training, value) : state.trainings.push(value);
    persist("Allenamento salvato"); event.currentTarget.closest("dialog").close(); render();
  });

  $("#snapshot-form").addEventListener("submit", event => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name").trim();
    state.board.revisions.push({ id: uid("rev"), name, createdAt: new Date().toISOString(), tokens: clone(state.board.draftTokens) });
    persist("Versione salvata"); event.currentTarget.closest("dialog").close(); render();
  });

  const themeSelect = $("#theme-select");
  try { themeSelect.value = localStorage.getItem(STYLE_KEY) || "pratico"; } catch (_) { themeSelect.value = "pratico"; }
  document.body.dataset.theme = themeSelect.value;
  themeSelect.addEventListener("change", () => {
    document.body.dataset.theme = themeSelect.value;
    try { localStorage.setItem(STYLE_KEY, themeSelect.value); } catch (_) { /* style still active */ }
  });

  $("#reset-demo").addEventListener("click", () => {
    if (!confirm("Ripristinare tutti i dati demo? Le modifiche locali andranno perse.")) return;
    state = demoState(); undoStack = []; redoStack = []; trainingQuery = ""; persist("Dati demo ripristinati"); render();
  });

  function runSelfCheck() {
    try {
      const sample = demoState();
      const serialized = JSON.parse(JSON.stringify(sample));
      if (!validState(serialized) || serialized.board.draftTokens.length !== sample.board.draftTokens.length) throw new Error("Serializzazione stato non valida");
      const snapshot = clone(sample.board.draftTokens);
      sample.board.revisions.push({ id: "check", name: "Check", createdAt: new Date().toISOString(), tokens: snapshot });
      sample.board.draftTokens[0].x = .99;
      sample.board.draftTokens[0].label = "NEW";
      if (sample.board.revisions[0].tokens[0].x === .99 || sample.board.revisions[0].tokens[0].label === "NEW") throw new Error("Snapshot non immutabile");
      if (clamp(-2) !== 0 || clamp(2) !== 1 || clamp(.42) !== .42) throw new Error("Limiti coordinate errati");
      if (duration({ exercises: [{ minutes: 15 }, { minutes: "25" }, { minutes: 0 }] }) !== 40) throw new Error("Calcolo durata errato");
      selfCheckResult = { ok: true };
      console.info("Coachboard self-check superato");
    } catch (error) {
      selfCheckResult = { ok: false, error: error.message };
      console.error("Coachboard self-check fallito", error);
    }
  }

  if (new URLSearchParams(location.search).get("test") === "1") runSelfCheck();
  render();
})();
