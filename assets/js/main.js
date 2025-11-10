const pokemonList = document.getElementById('pokemonList');
const loadMoreButton = document.getElementById('loadMoreButton');
const searchInput = document.getElementById('search');
const backBtn = document.getElementById('backToList');

const maxRecords = 151;
const limit = 20;
let offset = 0;

/* =========================
   Traduções PT-BR
   ========================= */
const TYPE_PT = {
  normal:'normal', fire:'fogo', water:'água', grass:'planta', bug:'inseto',
  electric:'elétrico', ice:'gelo', ground:'terrestre', flying:'voador',
  poison:'veneno', fighting:'lutador', psychic:'psíquico', rock:'pedra',
  ghost:'fantasma', dragon:'dragão', dark:'noturno', steel:'aço', fairy:'fada'
};

const STAT_PT = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Ataque Especial',
  'special-defense': 'Defesa Especial',
  speed: 'Velocidade',
};

const ABILITY_PT = {
  'run-away':'Fuga', guts:'Coragem', hustle:'Esforço', intimidate:'Intimidar',
  'flash-fire':'Absorver Fogo', justified:'Justificado', overgrow:'Supercrescimento',
  blaze:'Chama', torrent:'Torrente', 'shield-dust':'Pó Escudo', 'shed-skin':'Troca de Pele',
  'compound-eyes':'Olhos Compostos', swarm:'Enxame', 'keen-eye':'Olho Vivo',
  'tangled-feet':'Pés Confusos', 'big-pecks':'Peito Inflado', static:'Estático',
  'lightning-rod':'Para-raios', 'volt-absorb':'Absorver Eletricidade', 'water-absorb':'Absorver Água',
  chlorophyll:'Clorofila', synchronize:'Sincronismo', 'inner-focus':'Foco Interno', pressure:'Pressão',
  levitate:'Levitar', 'sand-veil':'Véu de Areia', 'poison-point':'Ponto Venenoso',
  'cute-charm':'Charme Fofo', 'natural-cure':'Cura Natural', 'serene-grace':'Graça Serena',
  sturdy:'Robustez', 'rock-head':'Cabeça de Pedra', 'water-veil':'Véu de Água',
  'swift-swim':'Nado Veloz', 'rain-dish':'Cata-Chuva', drought:'Seca', 'arena-trap':'Armadilha de Areia',
  pickup:'Coletor', limber:'Maleável', 'effect-spore':'Esporos', oblivious:'Desatento',
  'cloud-nine':'Clima Nulo', insomnia:'Insônia', 'magnet-pull':'Imã', soundproof:'Antissom',
  'white-smoke':'Fumaça Branca', 'huge-power':'Poder Colossal', 'pure-power':'Poder Puro',
  'shell-armor':'Couraça', 'air-lock':'Anula Clima', 'poison-heal':'Cura Venenosa',
  technician:'Técnico', sniper:'Atirador de Elite', moxie:'Ímpeto', 'sheer-force':'Força Bruta',
  multiscale:'Multiescala', prankster:'Brincalhão', 'magic-guard':'Mágica',
  'magic-bounce':'Reflete Magia', 'mold-breaker':'Quebra-Moldes', download:'Download',
  adaptability:'Adaptabilidade', 'no-guard':'Sem Guarda', 'battle-armor':'Armadura de Batalha',
  'early-bird':'Acorda Cedo', 'thick-fat':'Gordura Espessa', overcoat:'Sobretudo',
  steelworker:'Metalúrgico', 'beast-boost':'Impulso Fera', 'grassy-surge':'Campo de Grama',
};

const prettify = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* =========================
   Renderização
   ========================= */
const cache = [];

function convertPokemonToLi(pokemon) {
  cache[pokemon.number] = pokemon;

  return `
    <li class="pokemon ${pokemon.type}" data-id="${pokemon.number}" data-types="${pokemon.types.join(',')}">
      <span class="number">#${pokemon.number}</span>
      <span class="name">${pokemon.name}</span>

      <div class="detail">
        <ol class="types">
          ${pokemon.types.map((type) =>
            `<li class="type ${type}">${TYPE_PT[type] || type}</li>`
          ).join('')}
        </ol>
        <img src="${pokemon.photo}" alt="${pokemon.name}" loading="lazy">
      </div>
    </li>
  `;
}

function loadPokemonItens(offset, limit) {
  pokeApi.getPokemons(offset, limit).then((pokemons = []) => {
    const newHtml = pokemons.map(convertPokemonToLi).join('');
    pokemonList.insertAdjacentHTML('beforeend', newHtml);
  });
}

loadPokemonItens(offset, limit);

loadMoreButton.addEventListener('click', () => {
  offset += limit;
  const qtdRecordsWithNexPage = offset + limit;

  if (qtdRecordsWithNexPage >= maxRecords) {
    const newLimit = maxRecords - offset;
    loadPokemonItens(offset, newLimit);
    loadMoreButton.parentElement.removeChild(loadMoreButton);
  } else {
    loadPokemonItens(offset, limit);
  }
});

/* =========================
   Busca por nome OU #id + Voltar
   ========================= */
let backupHtml = null;
const isNumericQuery = (s) => /^\s*#?\d+\s*$/.test(s || '');
const showBackBtn = (v) => backBtn && (backBtn.style.display = v ? 'inline-block' : 'none');

function restoreList() {
  if (searchInput) searchInput.value = '';
  if (backupHtml !== null) {
    pokemonList.innerHTML = backupHtml;
    backupHtml = null;
  } else {
    document.querySelectorAll('.pokemon').forEach((card) => (card.style.display = ''));
  }
  showBackBtn(false);
}

if (backBtn) backBtn.addEventListener('click', restoreList);

if (searchInput) {
  searchInput.addEventListener('input', async (e) => {
    const raw = e.target.value.trim();
    const q = raw.toLowerCase();

    // campo vazio -> restaura
    if (!q) { restoreList(); return; }

    // número (#43 ou 43) -> resultado único
    if (isNumericQuery(q)) {
      const id = parseInt(q.replace('#', ''), 10);
      if (!id || id < 1 || id > maxRecords) return;
      try {
        if (backupHtml === null) backupHtml = pokemonList.innerHTML;
        const pokemon = cache[id] || await pokeApi.getPokemonById(id);
        pokemonList.innerHTML = convertPokemonToLi(pokemon);
        showBackBtn(true);
      } catch {
        pokemonList.innerHTML = `<p style="padding:1rem">Nenhum Pokémon #${id} encontrado.</p>`;
        showBackBtn(true);
      }
      return;
    }

    // texto -> filtra por nome ou prefixo do número
    document.querySelectorAll('.pokemon').forEach((card) => {
      const name = card.querySelector('.name').textContent.toLowerCase();
      const number = card.querySelector('.number').textContent.replace('#', '');
      const match = name.includes(q) || number.startsWith(q.replace('#', ''));
      card.style.display = match ? '' : 'none';
    });
    showBackBtn(true);
  });
}

/* =========================
   Modal de Detalhes
   ========================= */
const modal = document.getElementById('pokeModal');
const closeModalBtn = document.getElementById('closeModal');

function openModal(pokemon) {
  document.getElementById('pokeTitle').textContent = pokemon.name;
  document.getElementById('pokeNumber').textContent = `#${pokemon.number}`;

  const img = document.getElementById('pokeImg');
  img.src = pokemon.photo;
  img.alt = pokemon.name;

  const typesEl = document.getElementById('pokeTypes');
  typesEl.innerHTML = pokemon.types
    .map((t) => `<li class="type ${t}">${TYPE_PT[t] || t}</li>`)
    .join('');

  const heightM = (pokemon.height / 10).toFixed(1).replace('.', ',');
  const weightKg = (pokemon.weight / 10).toFixed(1).replace('.', ',');
  document.getElementById('pokeHeight').textContent = `${heightM} m`;
  document.getElementById('pokeWeight').textContent = `${weightKg} kg`;

  document.getElementById('pokeAbilities').textContent =
    pokemon.abilities.map((a) => ABILITY_PT[a] || prettify(a)).join(', ');

  const statsEl = document.getElementById('pokeStats');
  statsEl.innerHTML = pokemon.stats
    .map((s) => {
      const label = STAT_PT[s.name] || prettify(s.name);
      const widthPct = Math.min(s.base, 160) / 1.6;
      return `
        <span>${label}</span>
        <div class="bar"><i style="width:${widthPct}%"></i></div>
      `;
    })
    .join('');

  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() { modal.setAttribute('aria-hidden', 'true'); }

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

pokemonList.addEventListener('click', (e) => {
  const li = e.target.closest('.pokemon');
  if (!li) return;
  const id = li.getAttribute('data-id');
  const pokemon = cache[id];
  if (pokemon) openModal(pokemon);
});
