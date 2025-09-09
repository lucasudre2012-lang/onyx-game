(async function(){
  const grid = document.getElementById('grid');
  const search = document.getElementById('search');
  const filter = document.getElementById('filter');
  const modal = document.getElementById('player');
  const frame = document.getElementById('frame');
  const title = document.getElementById('playerTitle');
  const closeBtn = document.getElementById('closeBtn');
  const openNewTab = document.getElementById('openNewTab');

  let manifest = [];
  try {
    const res = await fetch('manifest.json', {cache: 'no-store'});
    manifest = await res.json();
  } catch(e){
    grid.innerHTML = '<p style="opacity:.8">Aucun manifeste (manifest.json) trouvé.</p>';
    return;
  }

  // Remplir le filtre de genres
  const genres = Array.from(new Set(manifest.flatMap(g => g.genres || []))).sort();
  for(const g of genres){
    const opt = document.createElement('option');
    opt.value = g; opt.textContent = g;
    filter.appendChild(opt);
  }

  function render(){
    const q = (search.value || '').toLowerCase();
    const flt = filter.value;
    const items = manifest.filter(m => {
      const txt = (m.title + ' ' + (m.description || '')).toLowerCase();
      const genreOk = flt === 'all' || (m.genres || []).includes(flt);
      return txt.includes(q) && genreOk;
    });
    grid.innerHTML = '';
    if(!items.length){
      grid.innerHTML = '<p style="opacity:.7">Aucun jeu ne correspond.</p>';
      return;
    }
    for(const m of items){
      const card = document.createElement('article');
      card.className = 'card';
      const thumb = m.cover ? `<img alt="" src="${m.cover}">` : `${m.title}`;
      card.innerHTML = `
        <div class="card-thumb">${thumb}</div>
        <div class="card-body">
          <h3>${m.title}</h3>
          <p>${m.description || ''}</p>
          <div class="tags">${(m.genres||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
          <button class="play">Jouer</button>
        </div>`;
      card.querySelector('.play').addEventListener('click', ()=> openGame(m));
      grid.appendChild(card);
    }
  }

  function openGame(m){
    title.textContent = m.title;
    const url = m.url || `games/${m.file}`;
    frame.src = url;
    openNewTab.href = url;
    if(typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open','');
    const u = new URL(location.href);
    u.searchParams.set('game', m.slug || (m.file||'').replace(/\.html$/,''));
    history.replaceState({}, '', u);
  }

  function closeModal(){
    frame.src = 'about:blank';
    if(typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
    const u = new URL(location.href);
    u.searchParams.delete('game');
    history.replaceState({}, '', u);
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('close', closeModal);

  search.addEventListener('input', render);
  filter.addEventListener('change', render);

  // Deep link ?game=slug
  const params = new URLSearchParams(location.search);
  const slug = params.get('game');
  if(slug){
    const m = manifest.find(x => (x.slug || (x.file||'').replace(/\.html$/,'')) === slug);
    if(m) openGame(m);
  }

  render();
})();