let shots;
let gunX;
let gunY;
let gunSpeed = 16;

const record = false;
let recording = false;

let osc;
let playing = false;

let desperation = 0;
const desperationRate = 1.3;
const desperationRecovery = 1.1;

////////////////////// CLASSES

class Entity {
	constructor(pos) {
		this.x = pos.x;
		this.y = pos.y;
	}
}

class Shot extends Entity {
	constructor(from) {
		super(from);

		// align to gun
		this.x -= 15;
		this.y -= 2;

		this.speed = 30;
		this.render = this.drawBeam;
		this.length = 200;
	}

	animate() {
		this.x += this.speed;
		this.render();
	}

	drawBeam() {
		const beamWidths = [1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 6, 30];
		const beamColors = ["orange", "lightgreen", "white"];

		seal(() => {
			let shotColor = random(beamColors);
			let shotWidth = random(beamWidths);

			stroke(shotColor);
			strokeWeight(shotWidth);

			line(this.x, this.y, this.x + this.length, this.y);
		});
	}
}

////////////////////// CORE p5

function setup() {
	createCanvas(600, 300);

	shots = [];
	gunX = 50;
	gunY = height / 2;
	this.focus();
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

////////////////////// MECHANICS

function doDespair() {
	desperation = max(desperation / desperationRecovery, 0);
}

function drawShots() {
	for (const shot of shots) {
		shot.animate();

		if (shot.x >= width) {
			shots.shift();

			continue;
		}
	}
}

function drawGun() {
	seal(() => {
		textSize(30);
		scale(-1, 1);
		textAlign(CENTER, CENTER);
		text("🔫", -gunX, gunY);
	});
}

function enforceBarriers() {
	gunY = min(height - 50, max(50, gunY));
	gunX = min(width - 50, max(50, gunX));
}

function shoot() {
	shots.push(new Shot({ x: gunX, y: gunY }));
	pewPew();
}

////////////////////// HELPERS

// wrapper for render atomicity
function seal(f) {
	push();
	f();
	pop();
}

////////////////////// UI

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

////////////////////// AUDIO

function doAudio() {
	let a = min(desperation / (30 * desperationRate), 1);

	let intensity = lerp(a, 0, 0.05);
	osc.amp(intensity);
}

function pewPew() {
	playing = true;

	// Calculate ramp duration and frequency based on the number of shots
	const rampDuration = 0.2;
	const startFreq = random(100, 200 + desperation * 25); // Low frequency for the start
	const endFreq = min(startFreq, 500); // High frequency for the end

	// Ramp frequency up over the ramp duration
	osc.freq(startFreq, 0.0); // Start at the low frequency
	osc.freq(endFreq, rampDuration); // Ramp to the high frequency
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

////////////////////// INPUT

function keyPressed() {
	activateSound();

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
		if (!recording & record) {
			recording = true;
			saveGif("pewpew", 3);
		}
		desperation += 1.3;
		shoot();
	}
}
