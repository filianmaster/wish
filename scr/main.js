import * as THREE from "three";

const landing = document.getElementById("landing");
const world = document.getElementById("world");
const enterBtn = document.getElementById("enterBtn");
const backBtn = document.getElementById("backBtn");
const wishBtn = document.getElementById("wishBtn");
const wishInput = document.getElementById("wishInput");
const wishMessage = document.getElementById("wishMessage");
const toast = document.getElementById("toast");
const canvas = document.getElementById("scene");

let renderer, scene, camera, clock, animationId;
let started = false;
const keys = new Set();
const objects = [];
const collidable = [];
let yaw = 0, pitch = -0.12, pointerLocked = false;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function material(color, roughness=0.9) {
  return new THREE.MeshStandardMaterial({color, roughness});
}
function addMesh(geometry, mat, x, y, z, target=objects) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x,y,z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  target.push(mesh);
  return mesh;
}
function makeTree(x,z,scale=1) {
  const trunk = addMesh(new THREE.CylinderGeometry(.18*scale,.25*scale,1.8*scale,7),material(0x62412f),x,.9*scale,z,collidable);
  const crown = addMesh(new THREE.ConeGeometry(1.15*scale,2.8*scale,8),material(0x28634c),x,2.65*scale,z);
  crown.position.x += 0.03;
  addMesh(new THREE.ConeGeometry(.85*scale,2.1*scale,8),material(0x34795b),x,3.55*scale,z);
  return trunk;
}
function createWorld() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9ab9d2);
  scene.fog = new THREE.Fog(0x9ab9d2, 28, 100);
  camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, .1, 180);
  camera.position.set(0,1.7,8);
  renderer = new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene.add(new THREE.HemisphereLight(0xdceaff,0x53634d,2.0));
  const sun = new THREE.DirectionalLight(0xffedcf,2.3);
  sun.position.set(-15,25,10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048); scene.add(sun);

  addMesh(new THREE.PlaneGeometry(180,180),material(0x628b62),0,-.08,0).rotation.x=-Math.PI/2;
  // Rolling hills
  for(let i=0;i<13;i++){
    const x=(i%5-2)*17 + (Math.random()-.5)*5;
    const z=-22-Math.floor(i/5)*20+(Math.random()-.5)*8;
    const hill=addMesh(new THREE.SphereGeometry(1,18,12),material(i%2?0x789b72:0x6d916c),x,-1.2,z);
    hill.scale.set(13+Math.random()*5,4+Math.random()*3,10+Math.random()*5);
  }
  // Lake
  const lake = addMesh(new THREE.CircleGeometry(8,48),new THREE.MeshStandardMaterial({color:0x4d9db4,roughness:.2,metalness:.12}),-12,.015,-15);
  lake.rotation.x=-Math.PI/2;
  // Trees around the meadow
  for(let i=0;i<70;i++){
    const angle=Math.random()*Math.PI*2, radius=13+Math.random()*34;
    const x=Math.cos(angle)*radius, z=Math.sin(angle)*radius-12;
    if(Math.hypot(x+12,z+15)<10) continue;
    makeTree(x,z,.65+Math.random()*.65);
  }
  // A small welcoming house
  const houseX=7, houseZ=-12;
  addMesh(new THREE.BoxGeometry(5,3.5,4),material(0xd6c2a1),houseX,1.75,houseZ,collidable);
  const roof=addMesh(new THREE.ConeGeometry(3.8,2.4,4),material(0x70445e),houseX,4.65,houseZ);
  roof.rotation.y=Math.PI/4;
  addMesh(new THREE.BoxGeometry(1.1,2,0.15),material(0x563b2e),houseX,1,houseZ+2.08);
  // Ambient glowing wish crystals
  for(let i=0;i<12;i++){
    const x=(Math.random()-.5)*38,z=-5-Math.random()*38;
    const crystal=addMesh(new THREE.OctahedronGeometry(.35),new THREE.MeshStandardMaterial({color:0xc8a6ff,emissive:0x6840aa,emissiveIntensity:.7}),x,.7,z);
    crystal.userData.float=true; crystal.userData.baseY=.7;
  }
  clock = new THREE.Clock();
}
function resize() {
  if(!renderer || !camera) return;
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}
function updateCamera(dt) {
  camera.rotation.order="YXZ";
  camera.rotation.set(pitch,yaw,0);
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const move=new THREE.Vector3();
  if(keys.has("KeyW")) move.add(forward);
  if(keys.has("KeyS")) move.sub(forward);
  if(keys.has("KeyD")) move.add(right);
  if(keys.has("KeyA")) move.sub(right);
  if(move.lengthSq()>0){
    move.normalize().multiplyScalar((keys.has("ShiftLeft")?10:5)*dt);
    camera.position.add(move);
  }
  camera.position.x=THREE.MathUtils.clamp(camera.position.x,-65,65);
  camera.position.z=THREE.MathUtils.clamp(camera.position.z,-70,45);
  camera.position.y=1.7;
}
function animate() {
  animationId=requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  updateCamera(dt);
  const t=clock.elapsedTime;
  for(const obj of objects){
    if(obj.userData.float) obj.position.y=obj.userData.baseY+Math.sin(t*1.7+obj.position.x)*.18;
  }
  renderer.render(scene,camera);
}
function enterWorld() {
  landing.classList.add("hidden");
  world.classList.remove("hidden");
  if(!started){
    createWorld(); started=true;
    window.addEventListener("resize",resize);
    animate();
  } else resize();
}
enterBtn.addEventListener("click",enterWorld);
backBtn.addEventListener("click",()=>{
  world.classList.add("hidden"); landing.classList.remove("hidden");
  if(document.pointerLockElement) document.exitPointerLock();
});
canvas.addEventListener("click",()=>canvas.requestPointerLock?.());
document.addEventListener("pointerlockchange",()=>{pointerLocked=document.pointerLockElement===canvas;});
document.addEventListener("mousemove",e=>{
  if(!pointerLocked || world.classList.contains("hidden")) return;
  yaw-=e.movementX*.0022;
  pitch-=e.movementY*.0022;
  pitch=THREE.MathUtils.clamp(pitch,-1.25,1.25);
});
document.addEventListener("keydown",e=>{
  keys.add(e.code);
  if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
  if(e.code==="KeyE" && !world.classList.contains("hidden")) notify("Ты прислушиваешься к миру. Попробуй загадать желание.");
});
document.addEventListener("keyup",e=>keys.delete(e.code));
window.addEventListener("blur",()=>keys.clear());

function spawnWish(type) {
  const pos=camera.position.clone();
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  pos.add(dir.multiplyScalar(7)); pos.y=0;
  if(type==="flowers"){
    for(let i=0;i<15;i++){
      const x=pos.x+(Math.random()-.5)*4,z=pos.z+(Math.random()-.5)*4;
      addMesh(new THREE.CylinderGeometry(.025,.035,.45,5),material(0x347a43),x,.22,z);
      const petal=addMesh(new THREE.SphereGeometry(.16,8,8),material([0xff8fb1,0xffd76b,0xc8a6ff][i%3]),x,.52,z);
      petal.scale.set(1,.65,1);
    }
  } else if(type==="tree"){
    for(let i=0;i<5;i++) makeTree(pos.x+(Math.random()-.5)*5,pos.z+(Math.random()-.5)*5,.8+Math.random()*.35);
  } else if(type==="house"){
    addMesh(new THREE.BoxGeometry(3.5,2.5,3),material(0xe1cba9),pos.x,1.25,pos.z,collidable);
    const roof=addMesh(new THREE.ConeGeometry(2.7,1.8,4),material(0x79506d),pos.x,3.35,pos.z); roof.rotation.y=Math.PI/4;
  } else if(type==="chest"){
    addMesh(new THREE.BoxGeometry(1.4,.8,.9),material(0x87552c),pos.x,.4,pos.z);
    addMesh(new THREE.BoxGeometry(1.45,.16,.95),material(0xc18b42),pos.x,.86,pos.z);
  } else if(type==="drink"){
    addMesh(new THREE.CylinderGeometry(.22,.22,.8,16),material(0x8b4eaa),pos.x,.4,pos.z);
    addMesh(new THREE.CylinderGeometry(.23,.23,.08,16),material(0xe3d4ad),pos.x,.84,pos.z);
  } else {
    const orb=addMesh(new THREE.IcosahedronGeometry(.9,2),new THREE.MeshStandardMaterial({color:0xb58aff,emissive:0x7541c8,emissiveIntensity:1.2}),pos.x,1.1,pos.z);
    orb.userData.float=true; orb.userData.baseY=1.1;
  }
}
function makeWish() {
  const value=wishInput.value.trim();
  if(!value){wishMessage.textContent="Сначала напиши своё желание.";return;}
  const s=value.toLowerCase();
  let type="magic";
  if(/цвет|роз|тюльпан|ромаш|букет/.test(s)) type="flowers";
  else if(/дерев|лес|дуб|сос|ель/.test(s)) type="tree";
  else if(/дом|хижин|коттедж/.test(s)) type="house";
  else if(/сундук|сокровищ|клад/.test(s)) type="chest";
  else if(/квас|напит|лимонад|вода|чай/.test(s)) type="drink";
  spawnWish(type);
  wishMessage.textContent=`Желание принято: «${value}». Мир откликнулся!`;
  notify("Желание воплощено в мире ✦");
  wishInput.value="";
}
wishBtn.addEventListener("click",makeWish);
wishInput.addEventListener("keydown",e=>{if(e.key==="Enter")makeWish();});
