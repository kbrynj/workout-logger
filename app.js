
(function() {
  const defaultExercises = [
    'Leg press','Chest press','Seated row','Shoulder press','Lat pulldown','Core'
  ];

  function $(id) { return document.getElementById(id); }

  function todayStr() {
    const d = new Date();
    return d.toISOString().slice(0,10);
  }

  function loadSessions() {
    try {
      return JSON.parse(localStorage.getItem('workouts')||'[]');
    } catch(e) {
      return [];
    }
  }

  function saveSessions(list) {
    localStorage.setItem('workouts', JSON.stringify(list));
  }

  function renderExercises(list) {
    const wrap = $('strengthList');
    wrap.innerHTML = '';
    list.forEach((name, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="row3">
          <div>
            <label>Exercise</label>
            <input data-idx="${idx}" class="ex_name" value="${name}">
          </div>
          <div>
            <label>Weight (kg)</label>
            <input data-idx="${idx}" class="ex_weight" type="number" step="0.5" placeholder="">
          </div>
          <div>
            <label>Reps × Sets</label>
            <input data-idx="${idx}" class="ex_rs" placeholder="12 × 3">
          </div>
        </div>
        <div class="actions" style="margin-top:8px;">
          <button class="btn secondary rmBtn" data-idx="${idx}">Remove</button>
        </div>
      `;
      wrap.appendChild(card);
    });
    wrap.querySelectorAll('.rmBtn').forEach(btn => btn.addEventListener('click', (e)=> {
      const i = parseInt(e.target.dataset.idx);
      exercises.splice(i,1);
      renderExercises(exercises);
    }));
  }

  function renderSessions() {
    const list = loadSessions().sort((a,b)=> (a.date < b.date ? 1 : -1));
    const host = $('sessions');
    if (!list.length) { host.innerHTML = '<p class="muted">No sessions yet.</p>'; return; }
    const tbl = document.createElement('table');
    tbl.innerHTML = `
      <thead>
        <tr><th>Date</th><th>Warm-up</th><th>Strength count</th><th>Cardio</th><th>Notes</th><th></th></tr>
      </thead>
      <tbody></tbody>
    `;
    const tb = tbl.querySelector('tbody');
    list.forEach((s, i) => {
      const tr = document.createElement('tr');
      const wu = `${s.warmup.speed||'-'} km/h @ ${s.warmup.incline||'-'}%`;
      const cardio = `${s.cardio.time||'-'} min, walk ${s.cardio.walk||'-'} / run ${s.cardio.run||'-'} km/h`;
      tr.innerHTML = `
        <td>${s.date}</td>
        <td>${wu}</td>
        <td>${s.exercises.length}</td>
        <td>${cardio}</td>
        <td>${(s.notes||'').slice(0,30)}</td>
        <td class="actions">
          <button class="btn secondary viewBtn" data-id="${s.id}">View</button>
          <button class="btn warn delBtn" data-id="${s.id}">Delete</button>
        </td>
      `;
      tb.appendChild(tr);
    });
    host.innerHTML = '';
    host.appendChild(tbl);

    host.querySelectorAll('.delBtn').forEach(b => b.addEventListener('click', (e)=> {
      const id = e.target.dataset.id;
      const list = loadSessions().filter(s => s.id !== id);
      saveSessions(list);
      renderSessions();
    }));

    host.querySelectorAll('.viewBtn').forEach(b => b.addEventListener('click', (e)=> {
      const id = e.target.dataset.id;
      const s = loadSessions().find(x => x.id === id);
      if (!s) return;
      alert(JSON.stringify(s, null, 2));
    }));
  }

  function toCSV(list) {
    const headers = ['date','energy','wu_speed','wu_incline','wu_pulse','exercises','cardio_time','cardio_walk','cardio_run','cardio_avg','cardio_max','cardio_incline','notes'];
    const rows = list.map(s => ([
      s.date, s.energy, s.warmup.speed, s.warmup.incline, s.warmup.pulse,
      s.exercises.map(e=>`${e.name}|${e.weight}|${e.rs}`).join(';'),
      s.cardio.time, s.cardio.walk, s.cardio.run, s.cardio.avg, s.cardio.max, s.cardio.incline,
      (s.notes||'').replace(/\n/g,' '),
    ]));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csv;
  }

  function download(filename, content, type='text/plain') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type}));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // State
  let exercises = Array.from(defaultExercises);

  function resetForm() {
    $('date').value = todayStr();
    $('energy').value = 'OK';
    $('wu_speed').value = '';
    $('wu_incline').value = '';
    $('wu_pulse').value = '';
    $('cardio_time').value = '';
    $('cardio_walk').value = '';
    $('cardio_run').value = '';
    $('cardio_avg').value = '';
    $('cardio_max').value = '';
    $('cardio_incline').value = '';
    $('notes').value = '';
    exercises = Array.from(defaultExercises);
    renderExercises(exercises);
  }

  function collectExercises() {
    const names = Array.from(document.querySelectorAll('.ex_name')).map(i=>i.value.trim());
    const weights = Array.from(document.querySelectorAll('.ex_weight'));
    const repsets = Array.from(document.querySelectorAll('.ex_rs'));
    const list = names.map((n, i) => ({ name:n, weight: weights[i].value, rs: repsets[i].value }));
    return list.filter(e => e.name);
  }

  function saveSession() {
    const session = {
      id: 'w_' + Date.now(),
      date: $('date').value || todayStr(),
      energy: $('energy').value,
      warmup: {
        speed: $('wu_speed').value,
        incline: $('wu_incline').value,
        pulse: $('wu_pulse').value
      },
      exercises: collectExercises(),
      cardio: {
        time: $('cardio_time').value,
        walk: $('cardio_walk').value,
        run: $('cardio_run').value,
        avg: $('cardio_avg').value,
        max: $('cardio_max').value,
        incline: $('cardio_incline').value
      },
      notes: $('notes').value
    };
    const list = loadSessions();
    list.push(session);
    saveSessions(list);
    renderSessions();
    resetForm();
  }

  // Events
  $('saveBtn').addEventListener('click', saveSession);
  $('resetBtn').addEventListener('click', resetForm);
  $('addExerciseBtn').addEventListener('click', () => {
    exercises.push('');
    renderExercises(exercises);
  });

  $('exportJsonBtn').addEventListener('click', ()=> {
    download('workouts.json', JSON.stringify(loadSessions(), null, 2), 'application/json');
  });

  $('exportCsvBtn').addEventListener('click', ()=> {
    download('workouts.csv', toCSV(loadSessions()), 'text/csv');
  });

  $('importFile').addEventListener('change', (e)=> {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          saveSessions(data);
          renderSessions();
          alert('Imported ' + data.length + ' sessions.');
        } else alert('Invalid JSON');
      } catch(err) { alert('Invalid JSON'); }
    };
    reader.readAsText(file);
  });

  // init
  resetForm();
  renderSessions();
})();
