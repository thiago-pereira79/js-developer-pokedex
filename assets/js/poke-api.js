const pokeApi = {};

function convertPokeApiDetailToPokemon(pokeDetail) {
  const pokemon = new Pokemon();

  pokemon.number = pokeDetail.id;
  pokemon.name = pokeDetail.name;

  const types = pokeDetail.types.map((slot) => slot.type.name);
  pokemon.types = types;
  pokemon.type = types[0];

  const dream = pokeDetail.sprites.other?.dream_world?.front_default;
  const official = pokeDetail.sprites.other?.['official-artwork']?.front_default;
  const front = pokeDetail.sprites.front_default;
  pokemon.photo = dream || official || front;

  pokemon.height = pokeDetail.height; // dm
  pokemon.weight = pokeDetail.weight; // hg
  pokemon.abilities = pokeDetail.abilities.map(a => a.ability.name);
  pokemon.stats = pokeDetail.stats.map(s => ({ name: s.stat.name, base: s.base_stat }));

  return pokemon;
}

pokeApi.getPokemonDetail = (pokemon) => {
  return fetch(pokemon.url).then(r => r.json()).then(convertPokeApiDetailToPokemon);
};

pokeApi.getPokemons = (offset = 0, limit = 5) => {
  const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
  return fetch(url)
    .then(r => r.json())
    .then(j => j.results)
    .then(list => list.map(pokeApi.getPokemonDetail))
    .then(reqs => Promise.all(reqs));
};

// busca direta por ID (para #43 etc.)
pokeApi.getPokemonById = (id) => {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}/`;
  return fetch(url)
    .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
    .then(convertPokeApiDetailToPokemon);
};
