var gun;
var game;

const record = false;
let recording = false;

var osc;
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

	seal(f) {
		push();
		f();
		pop();
	}
}

class Shot extends Entity {
	constructor(data) {
		super(data);

		this.hostileTo = data.hostileTo;

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

		super.seal(() => {
			let shotColor = random(beamColors);
			let shotWidth = random(beamWidths);

			stroke(shotColor);
			strokeWeight(shotWidth);

			line(this.x, this.y, this.x + this.length, this.y);
		});
	}
}

class Gun extends Entity {
	constructor(at) {
		super(at);
		this.speed = 16;
		this.size = 30;
		this.emoji = "🔫";
	}

	move(to) {
		this.x += to.x * this.speed;
		this.y += to.y * this.speed;
	}

	render() {
		super.seal(() => {
			textSize(this.size);
			scale(-1, 1);
			textAlign(CENTER, CENTER);
			text(this.emoji, -this.x, this.y);
		});
	}

	shoot() {
		pewPew();
		return new Shot({ x: this.x, y: this.y, hostileTo: Baddy });
	}
}

class Baddy extends Entity {
	constructor(data) {
		super(data);
		this.img = data.img;
		this.hp = data.hp;
	}

	render() {
		image(this.img, this.x, this.y);
	}
}

class Game {
	constructor(player) {
		this.player = player;
		this.enemies = [];
		this.shots = [];
	}

	spawnBoss(foo) {
		this.enemies.push(foo);
	}

	render() {
		this.player.render();
		this.drawShots();

		for (const enemy of this.enemies) {
			enemy.render();
		}
	}

	playerAttack() {
		this.shots.push(this.player.shoot());
	}

	drawShots() {
		for (const shot of this.shots) {
			shot.animate();

			if (shot.x >= width) {
				this.shots.shift();
				continue;
			}
		}
	}

	movePlayer(to) {
		this.player.move(to);
		this.player.y = min(height - 50, max(50, this.player.y));
		this.player.x = min(width - 50, max(50, this.player.x));
	}
}

////////////////////// CORE p5
var boss;
function preload() {
	boss = loadImage("assets/angel/body.png");
}

function setup() {
	createCanvas(600, 300);

	game = new Game(new Gun({ x: 50, y: height / 2 }));
	game.spawnBoss(new Baddy({ x: width - 200, y: 10, img: boss, hp: 1 }));

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

	game.render();
}

////////////////////// MECHANICS

function doDespair() {
	desperation = max(desperation / desperationRecovery, 0);
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

	const rampDuration = 0.2;
	const startFreq = random(100, 200 + desperation * 25);
	const endFreq = min(startFreq, 500);

	osc.freq(startFreq, 0.0);
	osc.freq(endFreq, rampDuration);
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
	// sound has to be activated in response to a user gesture
	activateSound();
	checkMoves();

	// spacebar
	if (keyIsDown(32)) {
		if (record & !recording) {
			recording = true;
			saveGif("pewpew", 3);
		}
		desperation += 1.3;
		game.playerAttack();
	}
}

function checkMoves() {
	let move = { x: 0, y: 0 };

	// w
	if (keyIsDown(87)) {
		move.y -= 1;
	}

	// a
	if (keyIsDown(65)) {
		move.x -= 1;
	}

	// s
	if (keyIsDown(83)) {
		move.y += 1;
	}

	// d
	if (keyIsDown(68)) {
		move.x += 1;
	}

	game.movePlayer(move);
}
