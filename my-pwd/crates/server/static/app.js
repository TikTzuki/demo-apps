// my-pwd frontend

let passwords = [];
let groups = [];
let currentUser = null;
let editingId = null;
let showAllPasswords = false;
let colWidths = [200, 170, 200, 90]; // Service, Username, Password, Actions

// ── Init ──────────────────────────────────────────────────

async function init() {
    try {
        const resp = await fetch('/auth/me');
        const data = await resp.json();

        hideAll();

        if (!data.logged_in) {
            show('view-login');
        } else if (!data.unlocked) {
            currentUser = data;
            const path = window.location.pathname;
            if (path === '/setup-master') {
                show('view-setup');
            } else {
                document.getElementById('master-greeting').textContent =
                    `Welcome back, ${data.name}`;
                show('view-master');
            }
        } else {
            currentUser = data;
            document.getElementById('dash-user').textContent = data.email;
            await loadData();
            show('view-dashboard');
        }
    } catch (e) {
        console.error('init error:', e);
        show('view-login');
    }
}

// ── Data loading ──────────────────────────────────────────

async function loadData() {
    const [pwdResp, grpResp] = await Promise.all([
        fetch('/api/passwords'),
        fetch('/api/groups'),
    ]);

    if (pwdResp.ok) passwords = await pwdResp.json();
    if (grpResp.ok) groups = await grpResp.json();

    populateGroupSelects();
    renderPasswords();
}

// ── Column grid template ──────────────────────────────────

function gridTemplate() {
    return `${colWidths[0]}px ${colWidths[1]}px ${colWidths[2]}px ${colWidths[3]}px`;
}

// ── Rendering ─────────────────────────────────────────────

function renderPasswords() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const groupFilter = document.getElementById('group-filter').value;

    let filtered = passwords.filter(p => {
        if (search && !p.service.toLowerCase().includes(search) &&
            !p.username.toLowerCase().includes(search)) return false;
        if (groupFilter === '__none__' && p.group_id) return false;
        if (groupFilter && groupFilter !== '__none__' && p.group_id !== groupFilter) return false;
        return true;
    });

    const container = document.getElementById('password-list');
    const noResults = document.getElementById('no-passwords');

    if (filtered.length === 0) {
        container.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    // Group the entries
    const grouped = {};
    const ungrouped = [];
    for (const p of filtered) {
        if (p.group_name) {
            (grouped[p.group_name] = grouped[p.group_name] || []).push(p);
        } else {
            ungrouped.push(p);
        }
    }

    let html = renderHeader();

    const renderSection = (title, items) => {
        if (title) {
            html += `<div class="flex items-center gap-2 mt-3 mb-1 px-1">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500">${esc(title)}</span>
        <span class="text-[10px] text-gray-600">${items.length}</span>
      </div>`;
        }
        html += `<div class="border border-gray-800 rounded-lg overflow-hidden">`;
        html += items.map((p, i) => renderRow(p, i > 0)).join('');
        html += `</div>`;
    };

    for (const [groupName, items] of Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))) {
        renderSection(groupName, items);
    }

    if (ungrouped.length > 0) {
        renderSection(Object.keys(grouped).length > 0 ? 'Ungrouped' : '', ungrouped);
    }

    container.innerHTML = html;
    initResizeHandles();
}

function renderHeader() {
    const gt = gridTemplate();
    return `<div class="grid items-center text-[10px] uppercase tracking-wider text-gray-500 px-1 mb-1 select-none" style="grid-template-columns: ${gt}">
    <div class="relative pr-2">Service<span class="resize-handle" data-col="0"></span></div>
    <div class="relative pr-2">Username<span class="resize-handle" data-col="1"></span></div>
    <div class="relative pr-2 cursor-pointer hover:text-gray-300" onclick="toggleShowAll()">Password <span class="text-[9px] text-gray-600">${showAllPasswords ? '(hide)' : '(show)'}</span><span class="resize-handle" data-col="2"></span></div>
    <div></div>
  </div>`;
}

function renderRow(p, showBorder) {
    const gt = gridTemplate();
    const border = showBorder ? 'border-t border-gray-800/50' : '';
    const isEditing = editingId === p.id;

    if (isEditing) {
        return renderEditRow(p, gt, border);
    }

    const safeService = esc(p.service).replace(/'/g, "\\'");
    return `<div class="grid items-center row-hover px-3 py-1.5 text-[13px] ${border}" style="grid-template-columns: ${gt}" data-id="${p.id}">
    <div class="truncate pr-2">
      <span class="text-gray-200">${esc(p.service)}</span>
      ${p.link ? `<a href="${esc(p.link)}" target="_blank" class="ml-1 text-indigo-400/50 hover:text-indigo-300 text-[10px]">&#8599;</a>` : ''}
    </div>
    <div class="truncate pr-2 text-gray-400 cursor-pointer hover:text-gray-200" onclick="event.stopPropagation();copyText('${esc(p.username).replace(/'/g, "\\'")}')">
      ${esc(p.username) || '<span class="text-gray-600">-</span>'}
    </div>
    <div class="truncate pr-2 mono text-gray-400 cursor-pointer hover:text-gray-200" onclick="event.stopPropagation();copyText(getPasswordValue('${p.id}'))">
      ${showAllPasswords ? esc(p.password) || '-' : '••••••••'}
    </div>
    <div class="flex items-center gap-0.5 justify-end">
      <span class="btn-icon" onclick="event.stopPropagation();startEdit('${p.id}')">edit</span>
      <span class="btn-icon danger" onclick="event.stopPropagation();deletePassword('${p.id}','${safeService}')">del</span>
    </div>
  </div>`;
}

function renderEditRow(p, gt, border) {
    const groupOptions = groups.map(g =>
        `<option value="${g.id}" ${p.group_id === g.id ? 'selected' : ''}>${esc(g.name)}</option>`
    ).join('');

    return `<div class="grid items-center px-3 py-1.5 bg-gray-800/40 ${border}" style="grid-template-columns: ${gt}" data-id="${p.id}">
    <div class="pr-2">
      <input type="text" value="${esc(p.service)}" id="edit-service-${p.id}"
             class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-[13px] text-gray-200 focus:outline-none focus:border-indigo-500">
    </div>
    <div class="pr-2">
      <input type="text" value="${esc(p.username)}" id="edit-username-${p.id}"
             class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-[13px] text-gray-200 focus:outline-none focus:border-indigo-500">
    </div>
    <div class="pr-2">
      <input type="text" value="${esc(p.password)}" id="edit-password-${p.id}"
             class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-[13px] text-gray-200 mono focus:outline-none focus:border-indigo-500">
    </div>
    <div class="flex items-center gap-0.5 justify-end">
      <span class="btn-icon text-green-400" onclick="event.stopPropagation();saveEdit('${p.id}')">save</span>
      <span class="btn-icon" onclick="event.stopPropagation();cancelEdit()">esc</span>
    </div>
  </div>
  <div class="grid items-center px-3 py-1 bg-gray-800/40 border-t border-gray-700/30 text-[12px]" style="grid-template-columns: 1fr 1fr">
    <div>
      <input type="text" value="${esc(p.link)}" id="edit-link-${p.id}" placeholder="URL (optional)"
             class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-400 focus:outline-none focus:border-indigo-500">
    </div>
    <div class="pl-2">
      <select id="edit-group-${p.id}" class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-400 focus:outline-none focus:border-indigo-500">
        <option value="">No group</option>
        ${groupOptions}
      </select>
    </div>
  </div>`;
}

// ── Inline editing ────────────────────────────────────────

function startEdit(id) {
    editingId = id;
    renderPasswords();
    const el = document.getElementById(`edit-service-${id}`);
    if (el) el.focus();
}

function cancelEdit() {
    editingId = null;
    renderPasswords();
}

async function saveEdit(id) {
    const service = document.getElementById(`edit-service-${id}`).value;
    const username = document.getElementById(`edit-username-${id}`).value;
    const password = document.getElementById(`edit-password-${id}`).value;
    const link = document.getElementById(`edit-link-${id}`).value;
    const group_id = document.getElementById(`edit-group-${id}`).value || null;

    if (!service) {
        showToast('Service name required', 'bg-red-700');
        return;
    }

    try {
        const resp = await fetch(`/api/passwords/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({service, username, password, link, group_id}),
        });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error || 'Failed');
        }
        editingId = null;
        await loadData();
        showToast('Saved', 'bg-green-700');
    } catch (err) {
        showToast(err.message, 'bg-red-700');
    }
}

// Keyboard shortcuts for edit mode
document.addEventListener('keydown', (e) => {
    if (!editingId) return;
    if (e.key === 'Escape') {
        cancelEdit();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveEdit(editingId);
    }
});

// ── Column resizing ───────────────────────────────────────

let resizing = null;

function initResizeHandles() {
    document.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const col = parseInt(handle.dataset.col);
            resizing = {col, startX: e.clientX, startW: colWidths[col]};
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
    });
}

document.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newW = Math.max(80, resizing.startW + diff);
    colWidths[resizing.col] = newW;

    // Update all grid rows live
    const gt = gridTemplate();
    document.querySelectorAll('[style*="grid-template-columns"]').forEach(el => {
        el.style.gridTemplateColumns = gt;
    });
});

document.addEventListener('mouseup', () => {
    if (resizing) {
        resizing = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
});

// ── Password visibility ───────────────────────────────────

function getPasswordValue(id) {
    const p = passwords.find(p => p.id === id);
    return p ? p.password : '';
}

function toggleShowAll() {
    showAllPasswords = !showAllPasswords;
    renderPasswords();
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied!', 'bg-green-700');
    }).catch(() => {
        showToast('Copy failed', 'bg-red-700');
    });
}

// ── Group select helpers ──────────────────────────────────

function populateGroupSelects() {
    const filter = document.getElementById('group-filter');
    const modal = document.getElementById('pwd-group');

    while (filter.options.length > 2) filter.remove(2);
    while (modal.options.length > 1) modal.remove(1);

    for (const g of groups) {
        filter.add(new Option(g.name, g.id));
        modal.add(new Option(g.name, g.id));
    }
}

// ── Password CRUD ─────────────────────────────────────────

function showAddModal() {
    document.getElementById('modal-pwd-title').textContent = 'Add Password';
    document.getElementById('pwd-edit-id').value = '';
    document.getElementById('form-password').reset();
    document.getElementById('pwd-error').classList.add('hidden');
    showModal('modal-password');
}

document.getElementById('form-password').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pwd-edit-id').value;
    const body = {
        service: document.getElementById('pwd-service').value,
        username: document.getElementById('pwd-username').value,
        password: document.getElementById('pwd-password').value,
        link: document.getElementById('pwd-link').value,
        group_id: document.getElementById('pwd-group').value || null,
    };

    try {
        const url = id ? `/api/passwords/${id}` : '/api/passwords';
        const method = id ? 'PUT' : 'POST';
        const resp = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error || 'Failed');
        }

        closeModal('modal-password');
        await loadData();
        showToast(id ? 'Updated!' : 'Added!', 'bg-green-700');
    } catch (err) {
        const errEl = document.getElementById('pwd-error');
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
    }
});

async function deletePassword(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
        const resp = await fetch(`/api/passwords/${id}`, {method: 'DELETE'});
        if (!resp.ok) throw new Error('Delete failed');
        if (editingId === id) editingId = null;
        await loadData();
        showToast('Deleted', 'bg-yellow-700');
    } catch (err) {
        showToast(err.message, 'bg-red-700');
    }
}

// ── Groups ────────────────────────────────────────────────

function showGroupsModal() {
    renderGroupsList();
    showModal('modal-groups');
}

function renderGroupsList() {
    const container = document.getElementById('groups-list');
    if (groups.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No groups yet.</p>';
        return;
    }

    container.innerHTML = groups.map(g => `
    <div class="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
      <span class="text-sm">${esc(g.name)}</span>
      <button onclick="deleteGroup('${g.id}', '${esc(g.name)}')" class="text-xs text-red-400 hover:text-red-300">Delete</button>
    </div>
  `).join('');
}

document.getElementById('form-group').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('group-name').value.trim();
    if (!name) return;

    try {
        const resp = await fetch('/api/groups', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name}),
        });
        if (!resp.ok) throw new Error('Failed');

        document.getElementById('group-name').value = '';
        await loadData();
        renderGroupsList();
        showToast('Group added!', 'bg-green-700');
    } catch (err) {
        showToast(err.message, 'bg-red-700');
    }
});

async function deleteGroup(id, name) {
    if (!confirm(`Delete group "${name}"?`)) return;

    try {
        const resp = await fetch(`/api/groups/${id}`, {method: 'DELETE'});
        if (!resp.ok) throw new Error('Failed');
        await loadData();
        renderGroupsList();
        showToast('Group deleted', 'bg-yellow-700');
    } catch (err) {
        showToast(err.message, 'bg-red-700');
    }
}

// ── Master password forms ─────────────────────────────────

document.getElementById('form-setup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = document.getElementById('setup-pwd').value;
    const confirm = document.getElementById('setup-pwd-confirm').value;
    const errEl = document.getElementById('setup-error');

    if (pwd !== confirm) {
        errEl.textContent = 'Passwords do not match';
        errEl.classList.remove('hidden');
        return;
    }

    try {
        const resp = await fetch('/auth/master/setup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: pwd}),
        });

        if (!resp.ok) {
            const data = await resp.json();
            throw new Error(data.error || 'Failed');
        }

        await init();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
    }
});

document.getElementById('form-master').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = document.getElementById('master-pwd').value;
    const errEl = document.getElementById('master-error');

    try {
        const resp = await fetch('/auth/master/verify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: pwd}),
        });

        if (!resp.ok) {
            const data = await resp.json();
            throw new Error(data.error || 'Wrong password');
        }

        await init();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
    }
});

// ── Logout ────────────────────────────────────────────────

async function doLogout() {
    await fetch('/auth/logout', {method: 'POST'});
    passwords = [];
    groups = [];
    currentUser = null;
    editingId = null;
    await init();
}

// ── Helpers ───────────────────────────────────────────────

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function hideAll() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-setup').classList.add('hidden');
    document.getElementById('view-master').classList.add('hidden');
    document.getElementById('view-dashboard').classList.add('hidden');
}

function show(id) {
    document.getElementById(id).classList.remove('hidden');
}

function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showToast(msg, cls) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `fixed bottom-6 right-6 px-4 py-2 rounded-lg text-sm font-medium z-50 ${cls}`;
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

// ── Boot ──────────────────────────────────────────────────

init();
