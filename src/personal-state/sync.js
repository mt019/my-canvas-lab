const OUTBOX_KEY = 'canvaslab:personal-state:outbox';
const OWNER_KEY = 'canvaslab:personal-state:owner';
const CACHE_PREFIX = 'canvaslab:personal-state:cache:';
const SYNC_EVENT = 'canvaslab:personal-state:changed';

let client = null;
let currentUser = null;
let flushing = null;

const COLLECTIONS = {
  seen: { key: 'canvaslab:brief:seen', entityType: 'brief', records: false },
  kept: { key: 'canvaslab:brief:kept', entityType: 'item', records: true },
  going: { key: 'canvaslab:brief:going', entityType: 'event', records: true },
  went: { key: 'canvaslab:brief:went', entityType: 'event', records: true },
};

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing and a full storage quota must not break the public site.
  }
}

function readOutbox() {
  const rows = readJson(OUTBOX_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function emit(key) {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
}

export function watchPersonalState(onChange) {
  const handler = (event) => onChange(event.detail?.key);
  window.addEventListener(SYNC_EVENT, handler);
  return () => window.removeEventListener(SYNC_EVENT, handler);
}

export function queuePersonalMutation({ state, entityType, entityId, active, metadata = null }) {
  if (!currentUser) return;
  const next = readOutbox().filter(
    (row) => !(row.userId === currentUser.id && row.state === state && row.entityId === entityId),
  );
  next.push({
    id: crypto.randomUUID(),
    userId: currentUser.id,
    state,
    entityType,
    entityId,
    active,
    metadata,
    changedAt: new Date().toISOString(),
  });
  writeJson(OUTBOX_KEY, next);
  void flushPersonalState().catch(() => {
    // The outbox is intentionally retained. AuthProvider retries on reconnect.
  });
}

export async function flushPersonalState() {
  if (!client || !currentUser || flushing) return flushing;
  const mine = readOutbox().filter((row) => row.userId === currentUser.id);
  if (mine.length === 0) return null;

  flushing = (async () => {
    const payload = mine.map((row) => ({
      user_id: row.userId,
      entity_type: row.entityType,
      entity_id: row.entityId,
      state: row.state,
      active: row.active,
      metadata: row.metadata,
      client_mutation_id: row.id,
      client_changed_at: row.changedAt,
    }));
    const { error } = await client
      .from('personal_states')
      .upsert(payload, { onConflict: 'user_id,entity_type,entity_id,state' });
    if (error) throw error;
    const sent = new Set(mine.map((row) => row.id));
    writeJson(OUTBOX_KEY, readOutbox().filter((row) => !sent.has(row.id)));
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

function localRows() {
  return Object.entries(COLLECTIONS).flatMap(([state, config]) => {
    const raw = readJson(config.key, []);
    if (!Array.isArray(raw)) return [];
    return raw.map((value) => {
      const record = config.records ? value : null;
      const entityId = config.records ? value?.id : value;
      return typeof entityId === 'string'
        ? { state, entityType: config.entityType, entityId, metadata: record }
        : null;
    }).filter(Boolean);
  });
}

function snapshotLocal() {
  return Object.fromEntries(
    Object.values(COLLECTIONS).map(({ key }) => [key, readJson(key, [])]),
  );
}

function restoreLocal(snapshot = {}) {
  for (const { key } of Object.values(COLLECTIONS)) {
    writeJson(key, Array.isArray(snapshot[key]) ? snapshot[key] : []);
    emit(key);
  }
}

function stashLocal(slot) {
  writeJson(`${CACHE_PREFIX}${slot}`, snapshotLocal());
}

function switchLocalOwner(user) {
  const previousOwner = localStorage.getItem(OWNER_KEY);
  if (previousOwner === user.id) return [];

  const guestRows = previousOwner ? [] : localRows();
  stashLocal(previousOwner || 'guest');
  restoreLocal(readJson(`${CACHE_PREFIX}${user.id}`, {}));
  localStorage.setItem(OWNER_KEY, user.id);
  return guestRows;
}

async function migrateLocalOnce(user, guestRows = []) {
  const key = `canvaslab:personal-state:migrated:${user.id}`;
  const firstMigration = localStorage.getItem(key) !== '1';
  const rows = [...(firstMigration ? localRows() : []), ...guestRows];
  const unique = new Map(rows.map((row) => [`${row.state}:${row.entityType}:${row.entityId}`, row]));
  for (const row of unique.values()) {
    queuePersonalMutation({ ...row, active: true });
  }
  await flushPersonalState();
  if (firstMigration) localStorage.setItem(key, '1');
  if (guestRows.length > 0) writeJson(`${CACHE_PREFIX}guest`, {});
}

async function pullRemote(user) {
  const { data, error } = await client
    .from('personal_states')
    .select('entity_type,entity_id,state,active,metadata,client_changed_at')
    .eq('user_id', user.id);
  if (error) throw error;

  for (const [state, config] of Object.entries(COLLECTIONS)) {
    const rows = (data ?? []).filter((row) => row.state === state && row.active);
    const value = config.records
      ? rows.map((row) => ({ ...row.metadata, id: row.entity_id }))
      : rows.map((row) => row.entity_id);
    writeJson(config.key, value);
    emit(config.key);
  }
}

export async function setPersonalSession(nextClient, user) {
  client = nextClient;
  currentUser = user;
  if (!client || !currentUser) return;
  const guestRows = switchLocalOwner(currentUser);
  await migrateLocalOnce(currentUser, guestRows);
  await flushPersonalState();
  await pullRemote(currentUser);
}

export function clearPersonalSession() {
  if (currentUser) stashLocal(currentUser.id);
  restoreLocal(readJson(`${CACHE_PREFIX}guest`, {}));
  localStorage.removeItem(OWNER_KEY);
  currentUser = null;
  client = null;
}

export function pendingPersonalMutations() {
  if (!currentUser) return 0;
  return readOutbox().filter((row) => row.userId === currentUser.id).length;
}

export const PERSONAL_COLLECTIONS = COLLECTIONS;
