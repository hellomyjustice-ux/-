// ※ Google Apps Script 웹 앱 배포 후 아래 URL을 교체하세요
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwzkqEetUyK-WNQ-pskhBpzemVSVu3y6Eqs2DnKtoWNKliVRU0KeGc5p6erTwDjfjM/exec';

const form        = document.getElementById('post-form');
const titleInput  = document.getElementById('title-input');
const nameInput   = document.getElementById('name-input');
const contentInput= document.getElementById('content-input');
const postList    = document.getElementById('post-list');
const postCount   = document.getElementById('post-count');
const emptyState  = document.getElementById('empty-state');
const syncStatus  = document.getElementById('sync-status');
const loadingView = document.getElementById('loading-view');

let posts = [];

// ── API 호출 ──────────────────────────────────────────────

async function fetchPosts() {
  setLoading(true);
  try {
    const res  = await fetch(`${GAS_URL}?action=getPosts`);
    const data = await res.json();
    posts = data.posts || [];
    renderPosts();
  } catch {
    showSync('error');
  } finally {
    setLoading(false);
  }
}

async function apiAdd(post) {
  showSync('saving');
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode:   'no-cors',        // GAS CORS 우회 — 응답은 opaque, 요청은 정상 전달됨
      body:   JSON.stringify({ action: 'add', ...post }),
    });
    showSync('saved');
  } catch {
    showSync('error');
  }
}

async function apiDelete(id) {
  showSync('saving');
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode:   'no-cors',
      body:   JSON.stringify({ action: 'delete', id }),
    });
    showSync('saved');
  } catch {
    showSync('error');
  }
}

// ── UI 렌더링 ─────────────────────────────────────────────

function renderPosts() {
  postList.innerHTML = '';
  postCount.textContent = posts.length;

  if (posts.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  [...posts].reverse().forEach((post, index) => {
    const li = document.createElement('li');
    li.className = 'post-card rounded-2xl p-5 sm:p-6';
    li.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 min-w-0">
          <span class="shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20">#${posts.length - index}</span>
          <h3 class="text-white font-semibold text-sm sm:text-base truncate">${escapeHtml(post.title)}</h3>
        </div>
        <button class="delete-btn shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer" data-id="${post.id}">삭제</button>
      </div>
      <p class="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(post.content)}</p>
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center gap-1.5 text-xs text-slate-500">
          <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span class="text-fuchsia-400 font-medium">${escapeHtml(post.name)}</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-slate-600">
          <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          ${formatDate(post.createdAt)}
        </div>
      </div>
    `;
    postList.appendChild(li);
  });
}

// ── 이벤트 ───────────────────────────────────────────────

form.addEventListener('submit', async e => {
  e.preventDefault();
  const title   = titleInput.value.trim();
  const name    = nameInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !name || !content) return;

  const post = { id: String(Date.now()), title, name, content, createdAt: new Date().toISOString() };

  // 낙관적 업데이트 (UI 즉시 반영)
  posts.push(post);
  renderPosts();
  titleInput.value   = '';
  nameInput.value    = '';
  contentInput.value = '';
  titleInput.focus();

  await apiAdd(post);
});

postList.addEventListener('click', async e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;

  // 낙관적 업데이트
  posts = posts.filter(p => p.id !== id);
  renderPosts();

  await apiDelete(id);
});

// ── 유틸 ─────────────────────────────────────────────────

function setLoading(on) {
  loadingView.classList.toggle('hidden', !on);
  postList.classList.toggle('hidden', on);
}

function showSync(state) {
  const map = {
    saving: { text: '저장 중…',  cls: 'text-violet-400' },
    saved:  { text: '저장됨 ✓',  cls: 'text-emerald-400' },
    error:  { text: '오류 발생 ✕', cls: 'text-red-400' },
  };
  const s = map[state];
  syncStatus.textContent  = s.text;
  syncStatus.className    = `text-xs transition-opacity ${s.cls}`;
  if (state !== 'saving') setTimeout(() => { syncStatus.textContent = ''; }, 2500);
}

function formatDate(iso) {
  const d   = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str = '') {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 초기화 ───────────────────────────────────────────────
fetchPosts();
