import type p5 from "p5";
import { draw as drawCenter } from "./renderer/center.ts";
import { draw as drawStatus } from "./renderer/status.ts";
import type { State } from "./state.ts";
import { frameRate } from "./const.ts";
import { getCurrentTick, midi } from "./midi.ts";
import audio from "./assets/2_lyrics.mp3?url";

export type Graphics = {
	background: p5.Graphics;
	lyrics: p5.Graphics;
	pianoRoll: p5.Graphics;
};

const renderers = import.meta.glob("./renderer/*.ts", {
	eager: true,
}) as Record<
	string,
	{ draw: (p: p5, graphics: Graphics, state: State) => void }
>;
const audioElement = new Audio(audio);
audioElement.autoplay = false;

let registeredCallback: ((e: KeyboardEvent) => void) | null = null;
let graphics: Graphics;
let prevMain: p5.Graphics;
let main: p5.Graphics;
let erroredLastFrame = false;
export const draw = import.meta.hmrify((p: p5, state: State) => {
	if (!audioElement.paused && !state.playing) {
		audioElement.pause();
	}
	if (audioElement.paused && state.playing) {
		audioElement.play();
		audioElement.currentTime = state.currentFrame / frameRate;
	}
	if (!graphics) {
		graphics = {
			background: p.createGraphics(p.width, p.height),
			lyrics: p.createGraphics(p.width, p.height),
			pianoRoll: p.createGraphics(p.width, p.height),
		};
		prevMain = p.createGraphics(p.width, p.height);
		main = p.createGraphics(p.width, p.height);
	}
	try {
		if (!registeredCallback) {
			registeredCallback = keydown(p, state);
			window.addEventListener(
				"keydown",
				registeredCallback as (e: KeyboardEvent) => void,
			);
		}

		if (state.playing) {
			state.currentFrame++;
		}
		graphics.background.background(255, 192);
		graphics.lyrics.clear();
		graphics.pianoRoll.clear();
		for (const renderer of Object.values(renderers)) {
			p.push();
			renderer.draw(p, graphics, state);
			p.pop();
		}

		p.image(graphics.background, 0, 0);

		main.clear();
		main.tint(255, 255 * 0.8);
		main.image(prevMain, 0, 0);
		main.tint(255);
		main.image(graphics.lyrics, 0, 0);
		main.image(graphics.pianoRoll, 0, 0);
		p.image(main, 0, 0);

		prevMain.clear();
		prevMain.image(main, 0, 0);

		const currentTick = getCurrentTick(state);
		const lastCymbal = midi.tracks
			.find((track) => track.name === "Artcore cymbal")!
			.notes.findLast(({ ticks }) => ticks <= currentTick);
		if (lastCymbal) {
			const diff =
				(state.currentFrame / frameRate) -
				midi.header.ticksToSeconds(lastCymbal.ticks);
			if (diff < 2) {
				p.push();
				p.fill(255, 255, 255, 255 * (1 - diff / 2));
				p.rect(0, 0, p.width, p.height);
				p.pop();
			}
		}

		erroredLastFrame = false;
	} catch (e) {
		p.push();
		p.background([255, 0, 0, 250]);
		p.textSize(64);
		p.textAlign(p.LEFT, p.TOP);
		p.fill([255, 255, 255]);
		p.text(String(e), 32, 32);
		p.pop();
		if (!erroredLastFrame) {
			console.error(e);
		}
		erroredLastFrame = true;
	}
});

const keydown = (p: p5, state: State) => (e: KeyboardEvent) => {
	if (e.key === " ") {
		state.playing = !state.playing;
	}
	if (e.key === "r") {
		state.currentFrame = 0;
		audioElement.currentTime = 0;
	}
	if (e.key === "ArrowRight") {
		state.currentFrame += frameRate * 5;
		audioElement.currentTime = state.currentFrame / frameRate;
	}
	if (e.key === "ArrowLeft") {
		state.currentFrame -= frameRate * 5;
		if (state.currentFrame < 0) {
			state.currentFrame = 0;
		}
		audioElement.currentTime = state.currentFrame / frameRate;
	}
};

if (import.meta.hot) {
	import.meta.hot.accept(() => {
		if (registeredCallback)
			window.removeEventListener("keydown", registeredCallback);

		audioElement.pause();
		graphics.background.remove();
		graphics.lyrics.remove();
		prevMain.remove();
		main.remove();
	});
}
