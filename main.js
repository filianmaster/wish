import * as THREE from "three";

const mount = document.querySelector("#game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb9c0);
scene.fog = new THREE.Fog(0x9bb9c0, 28, 115);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 220);
camera.position.set(0, 1.72, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd9efff, 0x61745c, 1.55));
const sun = new THREE.DirectionalLight(0xffe3bd, 2.4);
sun.position.set(-18, 30, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(220, 220),
  new THREE.MeshStandardMaterial({ color: 0x78966e, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const path = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 90),
  new THREE.MeshStandardMaterial({ color: 0xb5a783, roughness: 1 })
);
path.rotation.x = -Math.PI / 2;
path.position.set(0, 0.012, -22);
scene.add(path);

for (let i = 0; i < 18; i++) {
  const a = i / 18 * Math.PI * 2;
  const r = 62 + Math.sin(i * 2.1) * 8;
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 14),
    new THREE.MeshStandardMaterial({ color: i % 2 ? 0x688b78 : 0x789782 })
  );
  hill.scale.set(17 + (i % 3) * 4, 9 + (i % 4) * 2, 13);
  hill.position.set(Math.cos(a) * r, -3, Math.sin(a) * r - 20);
  scene.add(hill);
}

const water = new THREE.Mesh(
  new THREE.CircleGeometry(17, 64),
  new THREE.MeshStandardMaterial({ color: 0x6b9eaa, roughness: 0.24 })
);
water.rotation.x = -Math.PI / 2;
water.position.set(-28, 0.04, -37);
scene.add(water);

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x70513a });
const leafMats = [0x426d50, 0x527c57, 0x63885d].map(color => new THREE.MeshStandardMaterial({ color }));

function addTree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.3, 7), trunkMat);
  trunk.position.y = 1.15;
  trunk.castShadow = true;
  g.add(trunk);
  for (let j = 0; j < 3; j++) {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05 - j * 0.12, 1),
      leafMats[(j + Math.round(x) + 30) % 3]
    );
    crown.position.set(j % 2 ? 0.2 : -0.15, 2.35 + j * 0.55, 0);
    crown.castShadow = true;
    g.add(crown);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  scene.add(g);
}

for (let i = 0; i < 55; i++) {
  const side = i % 2 ? 1 : -1;
  addTree(side * (7 + Math.random() * 24), -55 + Math.random() * 75, 0.7 + Math.random() * 0.65);
}

function cabin() {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 3.2, 4.4),
    new THREE.MeshStandardMaterial({ color: 0xc7b69a })
  );
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.1, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x684b3d })
  );
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.9, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x594333 })
  );
  wall.position.y = 1.6;
  roof.position.y = 4.35;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.82;
  door.position.set(0, 0.95, 2.26);
  g.add(wall, roof, door);
  for (const x of [-1.65, 1.65]) {
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.85, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xa8d8dc, emissive: 0x345c60 })
    );
    windowMesh.position.set(x, 2, 2.26);
    g.add(windowMesh);
  }
  g.position.set(12, 0, -16);
  scene.add(g);
}
cabin();

const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
for (let i = 0; i < 12; i++) {
  const g = new THREE.Group();
  for (let j = 0; j < 5; j++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 0.8, 12, 10), cloudMat);
    puff.position.set(j * 1.6, Math.random() * 0.7, Math.random() * 0.7);
    puff.scale.y = 0.65;
    g.add(puff);
  }
  g.position.set(-50 + Math.random() * 100, 19 + Math.random() * 12, -65 + Math.random() * 45);
  scene.add(g);
}

let entered = false, yaw = 0, pitch = 0;
const keys = new Set();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();
const player = { position: new THREE.Vector3(0, 1.72, 8), speed: 6.2 };
const raycaster = new THREE.Raycaster();
const interactables = [];
const $ = selector => document.querySelector(selector);
const toast = $("#toast");
const wishStatus = $("#wishStatus");
const wishInput = $("#wishInput");

function enter() {
  entered = true;
  $("#centerMessage").classList.add("dismissed");
  $("#hud").classList.add("visible");
  $(".crosshair").classList.add("visible");
  renderer.domElement.requestPointerLock?.();
}
$("#enterButton").addEventListener("click", enter);

document.addEventListener("pointerlockchange", () => {
  $(".crosshair").classList.toggle("visible", entered && document.pointerLockElement === renderer.domElement);
});
document.addEventListener("mousemove", event => {
  if (!entered || document.pointerLockElement !== renderer.domElement) return;
  yaw -= event.movementX * 0.0022;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.0022, -1.35, 1.35);
});
document.addEventListener("keydown", event => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  keys.add(event.code);
  if (event.code === "KeyE") interact();
});
document.addEventListener("keyup", event => keys.delete(event.code));

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function label(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(12,22,23,.76)";
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(190,235,211,.65)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#effff5";
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 79, 460);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false
  }));
  sprite.scale.set(2.5, 0.62, 1);
  return sprite;
}

function register(group, name, action) {
  scene.add(group);
  interactables.push({ object: group, name, action });
}

function addKvass(pos) {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9b5b24, roughness: 0.18, transparent: true, opacity: 0.92 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.95, 24), glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.25, 20), glass);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 20),
    new THREE.MeshStandardMaterial({ color: 0xd6bd79, metalness: 0.45 }));
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.226, 0.226, 0.32, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe7d7a7 }));
  body.position.y = 0.55; neck.position.y = 1.13; cap.position.y = 1.3; paper.position.y = 0.55;
  const tag = label("ХОЛОДНЫЙ КВАС");
  tag.position.y = 1.85;
  g.add(body, neck, cap, paper, tag);
  g.position.copy(pos);
  register(g, "Квас", () => showToast("Ты получил настоящий игровой квас. Приятного! 🥤"));
}

function addFlower(pos) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.65, 6),
    new THREE.MeshStandardMaterial({ color: 0x477d46 }));
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2c85b }));
  stem.position.y = 0.32; center.position.y = 0.72; g.add(stem, center);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xe9a8c6 });
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), petalMat);
    const a = i / 6 * Math.PI * 2;
    petal.position.set(Math.cos(a) * 0.17, 0.72, Math.sin(a) * 0.17);
    petal.scale.y = 0.65;
    g.add(petal);
  }
  g.position.copy(pos);
  register(g, "Цветок", () => showToast("Ты аккуратно рассматриваешь цветок. 🌸"));
}

function addTreeWish(pos) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.3, 8), trunkMat);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), leafMats[1]);
  trunk.position.y = 1.15; crown.position.y = 3; g.add(trunk, crown);
  g.position.copy(pos);
  register(g, "Дерево", () => showToast("Твоё дерево будет расти в этом мире. 🌳"));
}

function addHouse(pos) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.7, 3.8),
    new THREE.MeshStandardMaterial({ color: 0xd4b995 }));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x79513f }));
  body.position.y = 1.35; roof.position.y = 3.55; roof.rotation.y = Math.PI / 4;
  g.add(body, roof); g.position.copy(pos);
  register(g, "Дом", () => showToast("Это твой новый дом. Добро пожаловать! 🏡"));
}

function addChest(pos) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5835 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 0.9), wood);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.25, 0.94),
    new THREE.MeshStandardMaterial({ color: 0xb17b45 }));
  body.position.y = 0.4; lid.position.y = 0.88; g.add(body, lid); g.position.copy(pos);
  register(g, "Сундук", () => showToast("Сундук пока пуст. Но это только начало! ✨"));
}

function spawnWish(text) {
  const q = text.toLowerCase();
  let type = "";
  if (/квас|напит|пить|вода|сок|лимонад/.test(q)) type = "kvass";
  else if (/цвет|роз|ромаш|букет|растени/.test(q)) type = "flower";
  else if (/дерев|лес|дуб|сосна/.test(q)) type = "tree";
  else if (/дом|коттедж|хижин|особняк/.test(q)) type = "house";
  else if (/сундук|ящик|короб/.test(q)) type = "chest";

  if (!type) {
    wishStatus.textContent = "Пока доступны: квас, цветок, дерево, дом или сундук.";
    showToast("Этому желанию ещё предстоит научиться. ✧");
    return;
  }
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const pos = player.position.clone().add(forward.multiplyScalar(3.2));
  pos.y = 0;
  ({ kvass: addKvass, flower: addFlower, tree: addTreeWish, house: addHouse, chest: addChest })[type](pos);
  wishStatus.textContent = "Желание исполнено: " + text;
  showToast("Желание исполнено! ✨");
}

$("#wishForm").addEventListener("submit", event => {
  event.preventDefault();
  const text = wishInput.value.trim();
  if (text) {
    spawnWish(text);
    wishInput.value = "";
  }
});

function interact() {
  if (!entered) return;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const targets = [];
  for (const item of interactables) {
    item.object.traverse(object => {
      if (object.isMesh || object.isSprite) targets.push({ object, item });
    });
  }
  const hits = raycaster.intersectObjects(targets.map(target => target.object), false);
  if (!hits.length) {
    showToast("Посмотри на созданный предмет и нажми E.");
    return;
  }
  const hit = targets.find(target => target.object === hits[0].object);
  if (hit) hit.item.action();
}

$("#helpButton").onclick = () => $("#helpModal").classList.remove("hidden");
$("#closeHelp").onclick = () => $("#helpModal").classList.add("hidden");
$("#gotIt").onclick = () => $("#helpModal").classList.add("hidden");

function update(dt) {
  if (!entered || document.pointerLockElement !== renderer.domElement) return;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  direction.set(0, 0, 0);
  if (keys.has("KeyW")) direction.add(forward);
  if (keys.has("KeyS")) direction.sub(forward);
  if (keys.has("KeyD")) direction.add(right);
  if (keys.has("KeyA")) direction.sub(right);
  if (direction.lengthSq()) direction.normalize();
  player.position.addScaledVector(direction, (keys.has("ShiftLeft") ? 10.5 : 6.2) * dt);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -48, 48);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -75, 35);
  camera.position.copy(player.position);
}

function animate() {
  requestAnimationFrame(animate);
  update(Math.min(clock.getDelta(), 0.05));
  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
