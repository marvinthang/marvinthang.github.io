/* file: assets/js/toc-scrollspy.js */
document.addEventListener('DOMContentLoaded', () => {
  const toc = document.querySelector('#toc');
  if (!toc) return;

  const links = Array.from(toc.querySelectorAll("a[href^='#']"));
  if (!links.length) return;

  const targets = links
    .map((a) =>
      document.querySelector(decodeURIComponent(a.getAttribute('href'))),
    )
    .filter(Boolean);

  // ===== helpers =====
  const expandChainForLink = (a) => {
    let el = a.parentElement;
    while (el && el !== toc) {
      if (el.classList?.contains('is-collapsed'))
        el.classList.remove('is-collapsed');
      if (el.classList?.contains('is-collapsible'))
        el.classList.add('is-expanded');
      el = el.parentElement;
    }
  };

  const keepLinkVisibleInToc = (a) => {
    const tocRect = toc.getBoundingClientRect();
    const aRect = a.getBoundingClientRect();

    // "fadeZone" is the safety buffer (in pixels) from the top/bottom edges.
    // Increased to 60px so it doesn't feel cramped.
    const fadeZone = 60;

    // Logic: If the link is hidden above or below the buffer zone,
    // smooth scroll the TOC container to reveal it.

    if (aRect.top < tocRect.top + fadeZone) {
      // Hiding above -> Glide UP
      const targetTop = toc.scrollTop - (tocRect.top + fadeZone - aRect.top);
      toc.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else if (aRect.bottom > tocRect.bottom - fadeZone) {
      // Hiding below -> Glide DOWN
      const targetTop =
        toc.scrollTop + (aRect.bottom - (tocRect.bottom - fadeZone));
      toc.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  const getActiveId = () => {
    // 1. Bottom of page check (Standard robust check)
    // Using documentElement.scrollHeight is often safer for dynamic content
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 20
    ) {
      return targets[targets.length - 1]?.id;
    }

    // 2. Activation threshold
    // 0.15 (15%) is the sweet spot.
    const y = window.innerHeight * 0.15;
    let active = targets[0];

    for (const h of targets) {
      if (h.getBoundingClientRect().top <= y) {
        active = h;
      } else {
        break;
      }
    }
    return active?.id;
  };

  // ===== state =====
  let lastActiveId = null;
  let ticking = false;

  const setActive = (id) => {
    // Prevent unnecessary updates
    if (!id || id === lastActiveId) return;
    lastActiveId = id;

    // 1. Remove active class from all
    for (const x of links) x.classList.remove('is-active-link');

    // 2. Find new active link
    const a = links.find((x) => x.getAttribute('href') === `#${id}`);
    if (!a) return;

    // 3. Update classes and Scroll sidebar
    a.classList.add('is-active-link');
    expandChainForLink(a);
    keepLinkVisibleInToc(a);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      setActive(getActiveId());
      ticking = false;
    });
  };

  // init
  setActive(getActiveId());

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
});
