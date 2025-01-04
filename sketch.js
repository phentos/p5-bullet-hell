let shots;
let gunX;
let gunY;
let gunSpeed = 16;
let shotLength = 200;
let shotMode = drawBeam;

const record = false;
let recording = false;

let osc;
let playing = false;

let desperation = 0;
const desperationRate = 1.3;
const desperationRecovery = 1.1;

function setup() {
	createCanvas(600, 300);

	shots = [];
	gunX = 50;
	gunY = height / 2;
	this.focus();
}

function doAudio() {
	let intensity = min(desperation / (5 * desperationRate), 1);
	osc.amp(intensity);
}

function activateSound() {
	if (!osc) {
		osc = new p5.Oscillator("triangle");
		osc.amp(0);
		osc.start();
	}
}

function stopSound() {
	if (osc) {
		osc.stop();
		playing = false;
	}
}

function pewPew() {
	playing = true;

	// Calculate ramp duration and frequency based on the number of shots
	const rampDuration = shotLength / 150;
	const startFreq = random(100, 200 + desperation * 25); // Low frequency for the start
	const endFreq = min(startFreq, 500); // High frequency for the end

	// Ramp frequency up over the ramp duration
	osc.freq(startFreq, 0.0); // Start at the low frequency
	osc.freq(endFreq, rampDuration); // Ramp to the high frequency
}

function doDespair() {
	desperation = max(desperation / desperationRecovery, 0);
}

function draw() {
	if (playing) {
		doAudio();
	}

	doDespair();

	if (keyIsPressed) {
		keyPressed();
	}

	background("black");

	drawHelp();
	drawShots();
	drawGun();
}

function drawShots() {
	for (const shot of shots) {
		shot.animate();

		if (shot.x >= width) {
			shots.shift();

			continue;
		}

		shotMode(shot);
	}
}

function drawBeam(shot) {
	const beamWidths = [1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 6, 30];
	const beamColors = ["orange", "lightgreen", "white"];

	seal(() => {
		let shotColor = random(beamColors);
		let shotWidth = random(beamWidths);

		stroke(shotColor);
		strokeWeight(shotWidth);

		line(shot.x, shot.y, shot.x + shotLength, shot.y);
	});
}

function drawGun() {
	seal(() => {
		textSize(30);
		scale(-1, 1);
		textAlign(CENTER, CENTER);
		text("🔫", -gunX, gunY);
	});
}

function keyPressed() {
	// w
	if (keyIsDown(87)) {
		gunY -= gunSpeed;
	}

	// a
	if (keyIsDown(65)) {
		gunX -= gunSpeed;
	}

	// s
	if (keyIsDown(83)) {
		gunY += gunSpeed;
	}

	// d
	if (keyIsDown(68)) {
		gunX += gunSpeed;
	}

	enforceBarriers();

	// spacebar
	if (keyIsDown(32)) {
		activateSound();

		if (!recording & record) {
			recording = true;
			saveGif("pewpew", 3);
		}
		desperation += 1.3;
		shoot();
	}
}

function enforceBarriers() {
	gunY = min(height - 50, max(50, gunY));
	gunX = min(width - 50, max(50, gunX));
}

function shoot() {
	shots.push(new Shot({ x: gunX, y: gunY }));
	pewPew();
}

class Shot {
	constructor(from) {
		this.x = from.x - 15;
		this.y = from.y - 2;
		this.speed = 30;
	}

	animate() {
		this.x += this.speed;
	}
}

// wrapper for render atomicity
function seal(f) {
	push();
	f();
	pop();
}

function drawHelp() {
	// let for eventually shooting the letters off...
	let line1 = "wasd to move";
	let line2 = "spacebar to shoot";
	seal(() => {
		textSize(20);
		fill("white");
		textAlign(RIGHT);
		text(line1, width - 50, height - 30);
		text(line2, width - 50, height - 50);
	});
}
