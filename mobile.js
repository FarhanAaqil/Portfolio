// Phone-only behaviour. The voyage window is pinned under the header (see mobile.css),
// so navigation has to land headings just below it rather than at the top of the screen.
(() => {
  const phone = matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)');
  const reading = () => document.body.classList.contains('reading-view');
  /** Bottom edge of whatever is pinned to the top: the header, plus the voyage window when it is showing. */
  const horizon = () => {
    const header = document.querySelector('header').getBoundingClientRect().bottom;
    const stage = document.getElementById('scene').getBoundingClientRect();
    return reading() || !stage.height ? header : Math.max(header, stage.bottom);
  };

  // Chart and menu navigation: put the chapter heading right under the window.
  const sail = window.sailTo;
  window.sailTo = id => {
    if (!phone.matches) return sail(id);
    const target = document.getElementById(id);
    if (!target) return;
    window.dispatchEvent(new Event('voyage-navigate'));
    const dialog = document.getElementById('map-dialog');
    if (dialog.open) dialog.close();
    history.replaceState(null, '', '#' + id);
    scrollTo({top: Math.max(0, target.getBoundingClientRect().top + scrollY - horizon()), behavior: 'instant'});
  };
  addEventListener('load', () => {
    const id = location.hash.slice(1);
    if (phone.matches && document.getElementById(id)?.classList.contains('chapter')) window.sailTo(id);
  }, {once: true});

  // Keyboard focus never hides behind the window.
  document.querySelector('main').addEventListener('focusin', event => {
    if (!phone.matches || !event.target.matches(':focus-visible')) return;
    const top = event.target.getBoundingClientRect().top;
    if (top < horizon() + 12) scrollBy(0, top - horizon() - 24);
  });

  // A way back out of look-around mode, where the header buttons are hidden.
  const exit = document.createElement('button');
  exit.id = 'mobile-exit';
  exit.textContent = 'Back to voyage';
  exit.addEventListener('click', () => window.dispatchEvent(new Event('voyage-navigate')));
  document.body.append(exit);

  // Screenshots open fitted to the screen; this lets you zoom in and pan.
  const visual = document.getElementById('artifact-visual');
  const zoom = document.createElement('button');
  zoom.id = 'artifact-zoom';
  zoom.type = 'button';
  const setZoom = on => {
    visual.classList.toggle('artifact-zoomed', on);
    zoom.textContent = on ? 'Fit screenshot' : 'Zoom screenshot';
    zoom.setAttribute('aria-pressed', String(on));
  };
  setZoom(false);
  zoom.addEventListener('click', () => setZoom(!visual.classList.contains('artifact-zoomed')));
  document.querySelector('.artifact-pagination').append(zoom);
  new MutationObserver(() => {
    setZoom(false);
    zoom.hidden = !visual.querySelector('img');
  }).observe(visual, {childList: true});
  document.getElementById('artifact-view').addEventListener('close', () => setZoom(false));

  // The header has no room for these on a phone, so they live in the chart.
  const actions = document.createElement('div');
  actions.className = 'mobile-chart-actions';
  for (const [label, id] of [['Meet the crew', 'crew-open'], ['Explore the Sunny', 'inspect-sunny'], ['Look around', 'look']]) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => {
      document.getElementById('map-dialog').close();
      document.getElementById(id).click();
    });
    actions.append(button);
  }
  const resume = document.createElement('a');
  resume.href = 'Farhan_Aaqil_Resume_main.pdf';
  resume.textContent = 'Download résumé';
  resume.download = '';
  actions.append(resume);
  document.getElementById('map-dialog').append(actions);
})();
