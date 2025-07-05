const db = firebase.database();
let userId = null;
let currentGameCode = null;
let isHost = false;
let isTagger = false;
let lastTagTime = 0;

firebase.auth().signInAnonymously().then(() => {
  userId = firebase.auth().currentUser.uid;
  document.getElementById('your-id').innerText = userId.slice(0, 6);
});

function createGame() {
  const code = generateGameCode();
  currentGameCode = code;
  isHost = true;

  db.ref(`games/${code}`).set({
    started: false,
    tagger: userId,
    players: {
      [userId]: { id: userId }
    }
  });

  enterGame(code);
}

function joinGame() {
  const code = document.getElementById("game-code-input").value.toUpperCase();
  if (!code) return alert("Enter a valid game code");
  currentGameCode = code;

  db.ref(`games/${code}/players/${userId}`).set({ id: userId });
  enterGame(code);
}

function enterGame(code) {
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  document.getElementById("game-code-display").innerText = code;

  db.ref(`games/${code}/players`).on("value", snapshot => {
    const players = snapshot.val() || {};
    updatePlayerList(players);
  });

  db.ref(`games/${code}`).on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;

    document.getElementById("your-role").innerText = data.tagger === userId
      ? "You are IT!"
      : "You're running!";

    isTagger = data.tagger === userId;

    if (isHost && !data.started) {
      document.getElementById("host-controls").style.display = "block";
    } else {
      document.getElementById("host-controls").style.display = "none";
    }
  });

  db.ref(`games/${code}/players/${userId}`).onDisconnect().remove();
}

function updatePlayerList(players) {
  const ul = document.getElementById("player-list");
  ul.innerHTML = "";

  Object.values(players).forEach(player => {
    const li = document.createElement("li");
    const shortId = player.id.slice(0, 6);
    li.textContent = shortId;

    if (player.id === userId) li.textContent += " (You)";
    if (isTagger && player.id !== userId) {
      const tagBtn = document.createElement("button");
      tagBtn.textContent = "Tag";
      tagBtn.onclick = () => tryTag(player.id);
      li.appendChild(tagBtn);
    }

    ul.appendChild(li);
  });
}

function tryTag(targetId) {
  const now = Date.now();
  if (now - lastTagTime < 2000) return alert("Wait a second before tagging again!");
  lastTagTime = now;

  db.ref(`games/${currentGameCode}`).once("value").then(snapshot => {
    const game = snapshot.val();
    if (!game.started) return;

    if (game.tagger === userId) {
      db.ref(`games/${currentGameCode}`).update({
        tagger: targetId
      });
    }
  });
}

function startGame() {
  db.ref(`games/${currentGameCode}`).update({ started: true });
}

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
