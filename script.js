(async function(){
  const grid = document.getElementById('grid');
  const search = document.getElementById('search');
  const filter = document.getElementById('filter');
  const modal = document.getElementById('player');
  const frame = document.getElementById('frame');
  const title = document.getElementById('playerTitle');
  const closeBtn = document.getElementById('closeBtn');
  const openNewTab = document.getElementById('openNewTab');
  const suggestBtn = document.getElementById('suggestBtn');
  const suggestModal = document.getElementById('suggestModal');
  const s_title = document.getElementById('s_title');
  const s_url = document.getElementById('s_url');
  const s_desc = document.getElementById('s_desc');
  const s_genres = document.getElementById('s_genres');
  const s_cancel = document.getElementById('s_cancel');
  const s_send = document.getElementById('s_send');
  const s_user = document.getElementById('s_user');

  let manifest = [];
  try {
    const res = await fetch('manifest.json', {cache: 'no-store'});
    manifest = await res.json();
  } catch(e){
    grid.innerHTML = '<p style="opacity:.8">Aucun manifeste (manifest.json) trouvé.</p>';
    return;
  }

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
      const isUser = !!m.user;
      const card = document.createElement('article');
      card.className = 'card' + (isUser ? ' user-card' : '');
      const thumb = m.cover ? `<img alt="" src="${m.cover}">` : `${m.title}`;
      card.innerHTML = `
        <div class="card-thumb">${thumb}</div>
        <div class="card-body">
          <h3>${m.title}</h3>
          ${isUser ? `<div class="userline"><span class="dot"></span><span>Ajouté par ${m.user}</span></div>` : ''}
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

  // Suggestion modal
  suggestBtn.addEventListener('click', ()=>{
    if(typeof suggestModal.showModal === 'function') suggestModal.showModal();
    else suggestModal.setAttribute('open','');
  });
  s_cancel.addEventListener('click', ()=>{
    if(typeof suggestModal.close === 'function') suggestModal.close();
    else suggestModal.removeAttribute('open');
  });
  s_send.addEventListener('click', (e)=>{
    const to = 'luca.sudre@outlook.com';
    const subject = `Proposition de jeu : ${s_title.value || ''}`;
    const body = [
      `Titre : ${s_title.value || ''}`,
      `URL : ${s_url.value || ''}`,
      `Description : ${s_desc.value || ''}`,
      `Genres : ${s_genres.value || ''}`,
      `Pseudo : ${s_user.value || ''}`,
      '',
      '— Envoyé depuis la galerie de jeux'
    ].join('\n');
    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if(typeof suggestModal.close === 'function') suggestModal.close();
    else suggestModal.removeAttribute('open');
    window.location.href = href;
    e.preventDefault();
  }, {passive:false});

  // Deep link ?game=slug
  const params = new URLSearchParams(location.search);
  const slug = params.get('game');
  if(slug){
    const m = manifest.find(x => (x.slug || (x.file||'').replace(/\.html$/,'')) === slug);
    if(m) openGame(m);
  }

  render();
})();