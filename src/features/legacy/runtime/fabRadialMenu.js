const FAB_POSITION_KEY = 'legacyFabPosition:v1';
const LONG_PRESS_MS = 500;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeVibrate() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(12);
  }
}

function loadPosition() {
  try {
    const raw = localStorage.getItem(FAB_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePosition(position) {
  try {
    localStorage.setItem(FAB_POSITION_KEY, JSON.stringify(position));
  } catch {
    // ignore storage failures
  }
}

export function initFabRadialMenu({
  root,
  fabButton,
  backdrop,
  actionButtons,
  moreButton,
  moreSheet,
  moreCloseButton,
  moreActionButtons,
  statusNode,
  onAction,
  moveEnabled = true,
}) {
  if (!root || !fabButton || !backdrop) return null;

  let isOpen = false;
  let isBusy = false;
  let longPressTimer = null;
  let isDragging = false;
  let didLongPress = false;
  let pointerTapHandledAt = 0;
  let dragOffset = { x: 0, y: 0 };

  const setOpen = (nextOpen, { skipHistory = false } = {}) => {
    if (isOpen === nextOpen) return;
    isOpen = nextOpen;
    root.classList.toggle('is-open', isOpen);
    fabButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) backdrop.removeAttribute('hidden');
    else backdrop.setAttribute('hidden', '');
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('fab-menu-open', isOpen);
    }
    if (isOpen) {
      safeVibrate();
      if (!skipHistory) {
        history.pushState({ fabOpen: true }, '');
      }
    }
  };

  const closeAll = ({ skipHistory = false } = {}) => {
    setOpen(false, { skipHistory });
    moreSheet?.setAttribute('hidden', '');
    moreButton?.setAttribute('aria-expanded', 'false');
  };

  const setStatus = (message, tone = 'idle') => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.dataset.tone = tone;
  };

  const runAction = async (actionId) => {
    if (!onAction || isBusy) return;
    isBusy = true;
    root.classList.add('is-busy');
    setStatus('Chargement…', 'loading');

    try {
      await onAction(actionId);
      setStatus('Action appliquée', 'success');
      closeAll();
    } catch (error) {
      setStatus('Erreur, réessayez', 'error');
    } finally {
      root.classList.remove('is-busy');
      isBusy = false;
    }
  };

  const applyPosition = (x, y) => {
    const maxX = window.innerWidth - 36;
    const maxY = window.innerHeight - 36;
    const next = { x: clamp(x, 36, maxX), y: clamp(y, 36, maxY) };
    root.style.setProperty('--fab-x', `${next.x}px`);
    root.style.setProperty('--fab-y', `${next.y}px`);
    savePosition(next);
  };

  const saved = loadPosition();
  if (saved) applyPosition(saved.x, saved.y);
  else applyPosition(window.innerWidth / 2, window.innerHeight / 2);

  const onPointerMove = (event) => {
    if (!isDragging) return;
    applyPosition(event.clientX - dragOffset.x, event.clientY - dragOffset.y);
  };

  const stopDragging = () => {
    isDragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDragging);
  };

  const startDragging = (event) => {
    const rect = fabButton.getBoundingClientRect();
    isDragging = true;
    dragOffset = {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
  };

  fabButton.addEventListener('pointerdown', (event) => {
    didLongPress = false;
    if (!moveEnabled) return;
    longPressTimer = window.setTimeout(() => {
      didLongPress = true;
      closeAll();
      startDragging(event);
      safeVibrate();
      setStatus('Bouton déplacé', 'success');
    }, LONG_PRESS_MS);
  });

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  fabButton.addEventListener('pointerleave', cancelLongPress);
  fabButton.addEventListener('pointercancel', cancelLongPress);
  fabButton.addEventListener('pointerup', () => {
    cancelLongPress();
    if (didLongPress || isBusy || isDragging) return;
    pointerTapHandledAt = Date.now();
    setOpen(!isOpen);
  });

  fabButton.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (isDragging || isBusy) return;
    setOpen(!isOpen);
  });

  if (!('PointerEvent' in window)) {
    fabButton.addEventListener('click', () => {
      if (Date.now() - pointerTapHandledAt < 700) return;
      if (isDragging || isBusy) return;
      setOpen(!isOpen);
    });
  }

  backdrop.addEventListener('click', () => closeAll());

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      runAction(button.dataset.action);
    });
  });

  moreButton?.addEventListener('click', () => {
    const expanded = moreButton.getAttribute('aria-expanded') === 'true';
    const nextExpanded = !expanded;
    moreButton.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    if (nextExpanded) {
      moreSheet?.removeAttribute('hidden');
    } else {
      moreSheet?.setAttribute('hidden', '');
    }
  });

  moreCloseButton?.addEventListener('click', () => {
    moreSheet?.setAttribute('hidden', '');
    moreButton?.setAttribute('aria-expanded', 'false');
  });

  moreActionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      runAction(button.dataset.action);
    });
  });

  window.addEventListener('popstate', () => {
    if (isOpen) {
      closeAll({ skipHistory: true });
    }
  });

  window.addEventListener('resize', () => {
    const savedPosition = loadPosition();
    if (savedPosition) {
      applyPosition(savedPosition.x, savedPosition.y);
    }
  });

  fabButton.setAttribute('aria-expanded', 'false');
  setStatus('Prêt', 'idle');

  return {
    isOpen: () => isOpen,
    close: closeAll,
    open: () => setOpen(true),
    runAction,
  };
}
