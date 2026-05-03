const ARENA_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

const DB_STATUS_ALIASES = Object.freeze({
  waiting: ARENA_STATUSES.DRAFT,
  running: ARENA_STATUSES.PUBLISHED,
  finished: ARENA_STATUSES.ARCHIVED,
});

const ACTOR_ROLES = Object.freeze({
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  VISITOR: 'visitor',
});

const SCREENS_BY_STATUS = Object.freeze({
  [ARENA_STATUSES.DRAFT]: 'editor',
  [ARENA_STATUSES.PUBLISHED]: 'editor_and_visitor',
  [ARENA_STATUSES.ARCHIVED]: 'editor_archive',
});

const TRANSITIONS = Object.freeze({
  [ARENA_STATUSES.DRAFT]: [ARENA_STATUSES.PUBLISHED],
  [ARENA_STATUSES.PUBLISHED]: [ARENA_STATUSES.ARCHIVED],
  [ARENA_STATUSES.ARCHIVED]: [],
});

const TRANSITION_PERMISSIONS = Object.freeze({
  [ACTOR_ROLES.OWNER]: new Set([`${ARENA_STATUSES.DRAFT}->${ARENA_STATUSES.PUBLISHED}`, `${ARENA_STATUSES.PUBLISHED}->${ARENA_STATUSES.ARCHIVED}`]),
  [ACTOR_ROLES.EDITOR]: new Set(),
  [ACTOR_ROLES.VIEWER]: new Set(),
  [ACTOR_ROLES.VISITOR]: new Set(),
});

const VISITOR_ALLOWED_ACTIONS = Object.freeze(['read_published_arena', 'read_published_bubbles']);

function normalizeStatus(status) {
  if (Object.values(ARENA_STATUSES).includes(status)) return status;
  if (DB_STATUS_ALIASES[status]) return DB_STATUS_ALIASES[status];
  return ARENA_STATUSES.DRAFT;
}

function toDbStatus(status) {
  const normalized = normalizeStatus(status);
  if (normalized === ARENA_STATUSES.DRAFT) return 'waiting';
  if (normalized === ARENA_STATUSES.PUBLISHED) return 'running';
  if (normalized === ARENA_STATUSES.ARCHIVED) return 'finished';
  return 'waiting';
}

function canTransition({ fromStatus, toStatus, actorRole }) {
  const from = normalizeStatus(fromStatus);
  const allowedNext = TRANSITIONS[from] || [];
  if (!allowedNext.includes(toStatus)) return false;
  const permissions = TRANSITION_PERMISSIONS[actorRole] || new Set();
  return permissions.has(`${from}->${toStatus}`);
}

function getAvailableTransitions({ status, actorRole }) {
  const from = normalizeStatus(status);
  return (TRANSITIONS[from] || []).filter((toStatus) => canTransition({ fromStatus: from, toStatus, actorRole }));
}

function getScreenPolicy({ status, actorRole }) {
  const normalizedStatus = normalizeStatus(status);
  const baseScreen = SCREENS_BY_STATUS[normalizedStatus];

  if (actorRole === ACTOR_ROLES.VISITOR) {
    return {
      screen: 'visitor_readonly',
      canRead: normalizedStatus === ARENA_STATUSES.PUBLISHED,
      allowedActions: VISITOR_ALLOWED_ACTIONS,
      canWrite: false,
      canTransition: false,
    };
  }

  return {
    screen: baseScreen,
    canRead: true,
    canWrite: actorRole === ACTOR_ROLES.OWNER || actorRole === ACTOR_ROLES.EDITOR,
    canTransition: actorRole === ACTOR_ROLES.OWNER,
    allowedTransitions: getAvailableTransitions({ status: normalizedStatus, actorRole }),
  };
}

export const arenaDomainService = {
  ARENA_STATUSES,
  ACTOR_ROLES,
  TRANSITIONS,
  SCREENS_BY_STATUS,
  VISITOR_ALLOWED_ACTIONS,
  normalizeStatus,
  canTransition,
  getAvailableTransitions,
  getScreenPolicy,
  toDbStatus,
};
