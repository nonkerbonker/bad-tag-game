const db = firebase.database();
let userId = null;
let currentGameCode = null;
let isTagger = false;

firebase.auth().signInAnonymously().then(() => {
  userId = firebase.auth().currentUser.uid;
  document.getElementById('your-id').innerText = `You are: ${userId.slice(0, 6)}`;
});

function createGame() {
  const code = generateGameCode();
  currentGameCode = code;

  db.ref(`games/${code}`).set({
    players: {
      [userId]: { id: userId, isTagger: true }
    }
  });

  goToGameScreen(code);
}

function joinGame() {
  const code = document.getElementById("game-code-input").value.toUpperCase();
  if (!code) return alert("Enter a valid game code");
  currentGameCode = code;

  db.ref(`games/${code}/players/${userId}`).set({ id: userId, isTagger: false });
  goToGameScreen(code);
}

function goToGameScreen(code) {
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  document.getElementById("game-code-display").innerText = code;

  const playersRef = db.ref(`games/${code}/players`);
  playersRef.on("value", snapshot => {
    const players = snapshot.val() || {};
    renderPlayerList(players);
  });
}

function renderPlayerList(players) {
  const ul = document.getElementById("player-list");
  ul.innerHTML = "";

  Object.values(players).forEach(player => {
    const li = document.createElement("li");
    const tagger = player.isTagger;
    const isSelf = player.id === userId;

    li.textContent = `${player.id.slice(0, 6)} ${tagger ? '👑 (Tagger)' : ''}`;

    if (isTagger && !tagger && !isSelf) {
      const btn = document.createElement("button");
      btn.textContent = "Tag!";
      btn.onclick = () => tagPlayer(player.id);
      li.appendChild(btn);
    }

    if (isSelf && player.isTagger) isTagger = true;
    ul.appendChild(li);
  });
}

function tagPlayer(newTaggerId) {
  const ref = db.ref(`games/${currentGameCode}/players`);

  ref.once("value", snapshot => {
    const players = snapshot.val() || {};
    for (let id in players) {
      players[id].isTagger = (id === newTaggerId);
    }
    ref.set(players);
  });
}

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
