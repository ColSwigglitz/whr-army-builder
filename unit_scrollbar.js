// ChromeOS can auto-hide native scrollbars. This custom scrollbar is always
// visible whenever the Add to Army list has overflow, while the list itself
// remains the real scroll container for wheel, trackpad, touch and keyboard.
(() => {
  function initialiseUnitScrollbar() {
    const list = document.querySelector('.unit-sections');
    if (!list || list.closest('.unit-scroll-shell')) return;

    const shell = document.createElement('div');
    shell.className = 'unit-scroll-shell';
    list.parentNode.insertBefore(shell, list);
    shell.appendChild(list);

    const track = document.createElement('div');
    track.className = 'unit-custom-scrollbar';
    track.setAttribute('aria-hidden', 'true');

    const thumb = document.createElement('div');
    thumb.className = 'unit-custom-scrollbar-thumb';
    thumb.tabIndex = -1;
    track.appendChild(thumb);
    shell.appendChild(track);

    const TRACK_INSET = 2;
    const MIN_THUMB = 46;

    function metrics() {
      const viewport = list.clientHeight;
      const content = list.scrollHeight;
      const trackHeight = Math.max(0, track.clientHeight - TRACK_INSET * 2);
      const overflow = Math.max(0, content - viewport);
      const thumbHeight = overflow > 0
        ? Math.max(MIN_THUMB, Math.min(trackHeight, trackHeight * viewport / content))
        : trackHeight;
      const travel = Math.max(0, trackHeight - thumbHeight);
      return { viewport, content, trackHeight, overflow, thumbHeight, travel };
    }

    function syncThumb() {
      const m = metrics();
      track.hidden = m.overflow <= 1;
      if (track.hidden) return;

      const ratio = m.overflow ? list.scrollTop / m.overflow : 0;
      thumb.style.height = `${m.thumbHeight}px`;
      thumb.style.transform = `translateY(${Math.max(0, Math.min(m.travel, ratio * m.travel))}px)`;
    }

    list.addEventListener('scroll', syncThumb, { passive: true });

    let dragStartY = 0;
    let dragStartScrollTop = 0;

    thumb.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const m = metrics();
      if (!m.overflow || !m.travel) return;

      dragStartY = event.clientY;
      dragStartScrollTop = list.scrollTop;
      thumb.classList.add('is-dragging');
      thumb.setPointerCapture(event.pointerId);
    });

    thumb.addEventListener('pointermove', event => {
      if (!thumb.hasPointerCapture(event.pointerId)) return;
      const m = metrics();
      if (!m.overflow || !m.travel) return;

      const delta = event.clientY - dragStartY;
      list.scrollTop = dragStartScrollTop + (delta / m.travel) * m.overflow;
    });

    const endDrag = event => {
      if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
      thumb.classList.remove('is-dragging');
    };
    thumb.addEventListener('pointerup', endDrag);
    thumb.addEventListener('pointercancel', endDrag);

    track.addEventListener('pointerdown', event => {
      if (event.target === thumb) return;
      event.preventDefault();
      const m = metrics();
      if (!m.overflow || !m.travel) return;

      const rect = track.getBoundingClientRect();
      const desiredThumbTop = event.clientY - rect.top - TRACK_INSET - m.thumbHeight / 2;
      const ratio = Math.max(0, Math.min(1, desiredThumbTop / m.travel));
      list.scrollTop = ratio * m.overflow;
    });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(syncThumb);
      resizeObserver.observe(list);
      resizeObserver.observe(shell);
    }

    const mutationObserver = new MutationObserver(syncThumb);
    mutationObserver.observe(list, { childList: true, subtree: true });

    window.addEventListener('resize', syncThumb, { passive: true });
    requestAnimationFrame(syncThumb);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseUnitScrollbar, { once: true });
  } else {
    initialiseUnitScrollbar();
  }
})();
