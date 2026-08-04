let zoneParticles = [[], [], [], []];
let digitPointCache = {};
let visibleDigitKey = "";
let lastSecond, lastMinute;
let mainFont, footerFont, sidebarFont;
let city = "", country = "";
let locationFetched = false;

const CANVAS_WIDTH = 3840;
const CANVAS_HEIGHT = 804;
const DESIGN_WIDTH = 3840;
const SCALE = CANVAS_WIDTH / DESIGN_WIDTH;

// Signage performance profile for Nvidia Shield / Enplug.
// Raise this toward 1400 if the unit is stable. Lower it to 700 if it still drops frames.
const PARTICLES_PER_ZONE = 900;
const TARGET_FPS = 30;
const POINT_STEP = 6;

const BG = [28, 27, 28];
const ACTIVE = [137, 201, 37];   // #89C925
const IDLE = [42, 51, 32];       // #2A3320
const SIDEBAR = '#8E9C9C';

function scaled(value) {
  return value * SCALE;
}

function preload() {
  mainFont = loadFont('assets/fonts/OpenSans-Bold.ttf?v=20260805a');
  footerFont = loadFont('assets/fonts/PTSerif-Bold.ttf?v=20260805a');
  sidebarFont = loadFont('assets/fonts/OpenSans-Semibold.ttf?v=20260805a');
}

function setup() {
  pixelDensity(1);
  frameRate(TARGET_FPS);

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent('stage');
  fitStageToViewport();

  buildDigitPointCache();
  createParticleZones();
  fetchLocation();

  lastSecond = second();
  lastMinute = minute();
}

function windowResized() {
  fitStageToViewport();
}

function fitStageToViewport() {
  const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || CANVAS_WIDTH);
  const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || CANVAS_HEIGHT);
  const stageScale = Math.min(1, viewportWidth / CANVAS_WIDTH, viewportHeight / CANVAS_HEIGHT);
  document.documentElement.style.setProperty('--stage-scale', stageScale.toFixed(6));
}

function createParticleZones() {
  let zoneWidth = width / 4;
  for (let z = 0; z < 4; z++) {
    let minX = z * zoneWidth;
    let maxX = (z + 1) * zoneWidth;
    for (let i = 0; i < PARTICLES_PER_ZONE; i++) {
      zoneParticles[z].push(new Particle(minX, maxX, z));
    }
  }
}

function buildDigitPointCache() {
  // The original sketch rebuilt this offscreen bitmap every frame.
  // This version builds each digit once, then reuses the point data.
  let t = createGraphics(600, 600);
  t.pixelDensity(1);
  t.textFont(mainFont);
  t.textSize(scaled(372));
  t.textAlign(CENTER, CENTER);
  t.noStroke();

  for (let d = 0; d <= 9; d++) {
    t.clear();
    t.background(0, 0);
    t.fill(255);
    t.text(String(d), 300, 300);
    t.loadPixels();

    let pts = [];
    for (let i = 0; i < t.width; i += POINT_STEP) {
      for (let j = 0; j < t.height; j += POINT_STEP) {
        let pixelIndex = (i + j * t.width) * 4;
        if (t.pixels[pixelIndex] > 127) {
          pts.push({ x: (i - 300) * 2, y: (j - 300) * 2 });
        }
      }
    }
    digitPointCache[String(d)] = pts;
  }

  t.remove();
}

// --- LOCATION FETCH LOGIC ---
function fetchLocation() {
  if (locationFetched) return;
  loadJSON('https://ipapi.co/json/', handleLocation, handleLocationError);
}

function handleLocation(data) {
  if (data && data.city && data.country_name) {
    city = data.city.toUpperCase();
    country = data.country_name.toUpperCase();
    locationFetched = true;
  }
}

function handleLocationError() {
  // Do not retry aggressively on signage hardware. Network retry loops can make weak WebViews worse.
  window.setTimeout(fetchLocation, 120000);
}

function draw() {
  background(BG[0], BG[1], BG[2]);

  let h = nf(hour(), 2);
  let m = nf(minute(), 2);
  let s = nf(second(), 2);
  let digits = [h[0], h[1], m[0], m[1]];

  let digitKey = digits.join('');
  if (digitKey !== visibleDigitKey) {
    updateDigitTargets(digits);
    visibleDigitKey = digitKey;
  }

  if (second() !== lastSecond) {
    applyVibration(scaled(10));
    lastSecond = second();
  }

  if (minute() !== lastMinute) {
    shatterEffect();
    lastMinute = minute();
  }

  for (let z = 0; z < 4; z++) {
    let zoneWidth = width / 4;
    let xOffset = (z * zoneWidth) + (zoneWidth / 2);
    let yOffset = height / 2 - scaled(140);
    for (let p of zoneParticles[z]) {
      p.behaviors();
      p.update();
      p.show(xOffset, yOffset);
    }
  }

  drawLayout(h + ":" + m + ":" + s, getSidebarText());
}

function updateDigitTargets(digits) {
  let zoneWidth = width / 4;
  for (let z = 0; z < 4; z++) {
    let xOffset = (z * zoneWidth) + (zoneWidth / 2);
    let yOffset = height / 2 - scaled(140);
    let pts = digitPointCache[digits[z]] || [];

    for (let i = 0; i < zoneParticles[z].length; i++) {
      let p = zoneParticles[z][i];
      if (i < pts.length) {
        p.setTarget(xOffset + pts[i].x, yOffset + pts[i].y);
      } else {
        p.clearTarget();
      }
    }
  }
}

function getSidebarText() {
  let monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  let dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  let dateStr = day() + " " + monthNames[month() - 1] + " " + year();
  let dayStr = dayNames[new Date().getDay()];
  let prefix = locationFetched ? city + ", " + country + " — " : "";
  return prefix + dateStr + " — " + dayStr;
}

function drawLayout(time, sidebarText) {
  let zoneW = width / 4;
  let dividerLerp = map(sin(frameCount * 0.008), -1, 1, 0, 0.3);
  let dividerR = lerp(255, 78, dividerLerp);
  let dividerG = lerp(255, 88, dividerLerp);
  let dividerB = lerp(255, 89, dividerLerp);

  for (let i = 0; i < 4; i++) {
    let startX = i * zoneW;

    textFont(footerFont);
    fill(255);
    noStroke();
    textAlign(LEFT, BOTTOM);
    textSize(scaled(50));
    text(time, startX + scaled(50), height - scaled(50));

    push();
    textFont(sidebarFont);
    fill(SIDEBAR);
    translate(startX + zoneW - scaled(60), height - scaled(50));
    rotate(-HALF_PI);
    textAlign(LEFT, CENTER);
    let sidebarSize = scaled(24);
    const availableLength = height - scaled(100);
    const measuredLength = Math.max(1, textWidth(sidebarText));
    if (measuredLength > availableLength) sidebarSize *= availableLength / measuredLength;
    textSize(sidebarSize);
    text(sidebarText, 0, 0);
    pop();

    stroke(dividerR, dividerG, dividerB);
    strokeWeight(scaled(2.0));
    line((i + 1) * zoneW, 0, (i + 1) * zoneW, height);
  }
}

function applyVibration(strength) {
  for (let z = 0; z < 4; z++) {
    for (let p of zoneParticles[z]) {
      let a = random(TWO_PI);
      let s = random(strength);
      p.ax += cos(a) * s;
      p.ay += sin(a) * s;
    }
  }
}

function shatterEffect() {
  for (let z = 0; z < 4; z++) {
    for (let p of zoneParticles[z]) {
      let a = random(TWO_PI);
      let s = random(scaled(140), scaled(260));
      p.ax += cos(a) * s;
      p.ay += sin(a) * s;
    }
  }
}

class Particle {
  constructor(minX, maxX, zoneIndex) {
    this.minX = minX;
    this.maxX = maxX;
    this.zoneIndex = zoneIndex;
    this.zoneCenterX = (minX + maxX) / 2;
    this.zoneCenterY = height / 2 - scaled(140);

    this.x = random(this.minX, this.maxX);
    this.y = random(height);
    this.tx = this.x;
    this.ty = this.y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.isTargeted = false;

    this.rActiveBase = scaled(8.4);
    this.rIdle = scaled(5.6);
    this.maxspeed = scaled(18);
    this.maxforce = scaled(1.6);

    this.cr = IDLE[0];
    this.cg = IDLE[1];
    this.cb = IDLE[2];
  }

  setTarget(x, y) {
    this.tx = x;
    this.ty = y;
    this.isTargeted = true;
  }

  clearTarget() {
    this.isTargeted = false;
  }

  behaviors() {
    if (this.isTargeted) {
      this.arrive();
    } else {
      let breathPhase = frameCount * 0.008 + (this.zoneIndex * PI / 2);
      let breathingStrength = map(sin(breathPhase), -1, 1, scaled(0.01), scaled(0.08));
      let n = noise(this.x * 0.003, this.y * 0.003, frameCount * 0.005);
      let noiseAngle = TWO_PI * n;

      this.ax += cos(noiseAngle) * scaled(0.1);
      this.ay += sin(noiseAngle) * scaled(0.1);

      let dx = this.zoneCenterX - this.x;
      let dy = this.zoneCenterY - this.y;
      let distanceToCentre = Math.sqrt(dx * dx + dy * dy) || 1;
      this.ax += (dx / distanceToCentre) * breathingStrength;
      this.ay += (dy / distanceToCentre) * breathingStrength;
    }

    let randomAngle = random(TWO_PI);
    this.ax += cos(randomAngle) * scaled(0.12);
    this.ay += sin(randomAngle) * scaled(0.12);
  }

  arrive() {
    let dx = this.tx - this.x;
    let dy = this.ty - this.y;
    let d = Math.sqrt(dx * dx + dy * dy) || 1;
    let speed = d < scaled(120) ? map(d, 0, scaled(120), 0, this.maxspeed) : this.maxspeed;
    let desiredX = (dx / d) * speed;
    let desiredY = (dy / d) * speed;
    let steerX = desiredX - this.vx;
    let steerY = desiredY - this.vy;
    let steerMag = Math.sqrt(steerX * steerX + steerY * steerY) || 1;

    if (steerMag > this.maxforce) {
      steerX = (steerX / steerMag) * this.maxforce;
      steerY = (steerY / steerMag) * this.maxforce;
    }

    this.ax += steerX;
    this.ay += steerY;
  }

  update() {
    this.vx += this.ax;
    this.vy += this.ay;

    let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
    if (speed > this.maxspeed) {
      this.vx = (this.vx / speed) * this.maxspeed;
      this.vy = (this.vy / speed) * this.maxspeed;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.ax = 0;
    this.ay = 0;
    this.vx *= 0.92;
    this.vy *= 0.92;

    if (this.x < this.minX || this.x > this.maxX) {
      this.vx *= -1;
      this.x = constrain(this.x, this.minX, this.maxX);
    }
    if (this.y < 0 || this.y > height) {
      this.vy *= -1;
      this.y = constrain(this.y, 0, height);
    }
  }

  show(cX, cY) {
    let targetColour = this.isTargeted ? ACTIVE : IDLE;
    this.cr += (targetColour[0] - this.cr) * 0.08;
    this.cg += (targetColour[1] - this.cg) * 0.08;
    this.cb += (targetColour[2] - this.cb) * 0.08;

    stroke(this.cr, this.cg, this.cb);

    if (this.isTargeted) {
      let dx = this.x - cX;
      let dy = this.y - cY;
      let d = Math.sqrt(dx * dx + dy * dy);
      let radialScale = map(d, 0, scaled(300), 3.2, 0.8);
      radialScale = constrain(radialScale, 0.8, 3.2);
      strokeWeight(this.rActiveBase * radialScale);
    } else {
      let breathPhase = frameCount * 0.01 + (this.zoneIndex * PI / 2) + (this.x * 0.005);
      let currentR = map(sin(breathPhase), -1, 1, this.rIdle * 0.8, this.rIdle * 2.3);
      strokeWeight(currentR);
    }

    point(this.x, this.y);
  }
}
