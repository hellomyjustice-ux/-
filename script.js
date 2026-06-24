const form = document.getElementById('post-form');
const titleInput = document.getElementById('title-input');
const contentInput = document.getElementById('content-input');
const postList = document.getElementById('post-list');
const postCount = document.getElementById('post-count');
const emptyState = document.getElementById('empty-state');

let posts = JSON.parse(localStorage.getItem('students-board-posts') || '[]');

function savePosts() {
  localStorage.setItem('students-board-posts', JSON.stringify(posts));
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20">
            #${posts.length - index}
          </span>
          <h3 class="text-white font-semibold text-sm sm:text-base truncate">${escapeHtml(post.title)}</h3>
        </div>
        <button
          class="delete-btn shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer"
          data-id="${post.id}"
        >삭제</button>
      </div>
      <p class="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(post.content)}</p>
      <div class="flex items-center gap-1.5 mt-4 text-xs text-slate-600">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        ${formatDate(post.createdAt)}
      </div>
    `;
    postList.appendChild(li);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return;

  posts.push({ id: Date.now(), title, content, createdAt: new Date().toISOString() });
  savePosts();
  renderPosts();

  titleInput.value = '';
  contentInput.value = '';
  titleInput.focus();
});

postList.addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  posts = posts.filter(p => p.id !== id);
  savePosts();
  renderPosts();
});

renderPosts();
