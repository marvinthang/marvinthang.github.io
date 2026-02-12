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
    // Expand only the chain for the CURRENT active item (stable + cheap)
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
    // Only scroll TOC if the active link is outside TOC viewport
    const tocRect = toc.getBoundingClientRect();
    const aRect = a.getBoundingClientRect();
    const outOfView = aRect.top < tocRect.top || aRect.bottom > tocRect.bottom;

    if (outOfView) a.scrollIntoView({ block: 'nearest' });
  };

  const getActiveId = () => {
    // Stable “activation line” (like docs scrollspy)
    const y = window.innerHeight * 0.25; // tweak: 0.2..0.35
    let active = targets[0];

    for (const h of targets) {
      if (h.getBoundingClientRect().top <= y) active = h;
      else break;
    }
    return active?.id;
  };

  // ===== state =====
  let lastActiveId = null;
  let ticking = false;

  const setActive = (id) => {
    if (!id || id === lastActiveId) return; // <- prevents spam updates
    lastActiveId = id;

    // clear + set active (use Chirpy's class to keep its styling)
    for (const x of links) x.classList.remove('is-active-link');

    const a = links.find((x) => x.getAttribute('href') === `#${id}`);
    if (!a) return;

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
