const grid = document.getElementById("game-grid");
const search = document.getElementById("search");
let allGames = [];

async function loadGames() {
    try {
        const res = await fetch("games.json");
        allGames = await res.json();
        renderGames(allGames);
    } catch (err) {
        console.error("Failed to load games.json:", err);
    }
}

function renderGames(list) {
    grid.innerHTML = "";
    list.forEach(g => {
        const card = document.createElement("div");
        card.className = "game-card";
        card.innerHTML = `
            <img src="${g.img}" alt="${g.name}">
            <h3>${g.name}</h3>
        `;
        card.onclick = () => window.location.href = g.url;
        grid.appendChild(card);
    });
}

search.addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    const filtered = allGames.filter(g => g.name.toLowerCase().includes(term));
    renderGames(filtered);
});

loadGames();
