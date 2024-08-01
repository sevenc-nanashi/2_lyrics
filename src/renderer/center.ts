import type p5 from "p5";
import lyrics from "../assets/lyrics.yml";
import { barHeight, bg, fg, height, width } from "../const.ts";
import type { Graphics } from "../draw.ts";
import { getCurrentMeasure, getCurrentPart } from "../midi.ts";
import type { State } from "../state.ts";

const shadowHeight = 32;

const himariFg = [128, 32, 128];
const ttFg = [192, 128, 32];

type PositionLocator = {
	measure: number;
	beat: number;
	div: number;
};
type LyricPart = {
	start: PositionLocator;
	end: PositionLocator;
	type: "himari" | "tt" | "other";
	multi: boolean;

	lyric: string;
};

const parsedLyrics = Object.entries(lyrics as Record<string, string>).map(
	([part, text]) => {
		const parsedPart =
			/(?<measure>\d+)\.(?<beat>\d+)\.(?<div>\d+)-(?<endMeasure>\d+)\.(?<endBeat>\d+)\.(?<endDiv>\d+)-(?<type>h|t|o)(?<multi>m)?/.exec(
				part,
			);
		if (!parsedPart?.groups) {
			throw new Error(`Invalid part name: ${part}`);
		}

		const { measure, beat, div, endMeasure, endBeat, endDiv, type, multi } =
			parsedPart.groups;

		const start = {
			measure: Number(measure),
			beat: Number(beat),
			div: Number(div),
		};
		const end = {
			measure: Number(endMeasure),
			beat: Number(endBeat),
			div: Number(endDiv),
		};

		const lyricPart: LyricPart = {
			start,
			end,
			type: type === "h" ? "himari" : type === "t" ? "tt" : "other",
			multi: multi === "m",

			lyric: text,
		};

		return lyricPart;
	},
);

export const draw = (p: p5, g: Graphics, state: State) => {
	p.noStroke();
	g.background.fill(bg);
	g.background.rect(0, height / 2 - barHeight / 2, width, barHeight);

	const shadow = getShadow(p);
	g.background.image(shadow, 0, 0);

	g.lyrics.fill(fg);
	g.lyrics.textFont("Zen Kaku Gothic New");
	g.lyrics.textAlign(p.CENTER, p.CENTER);
	g.lyrics.textSize(64);

	const part = getCurrentPart(state);
	const currentMeasure = getCurrentMeasure(state);
	const currentLyric = parsedLyrics.filter(
		(lyricPart) =>
			lyricPart.start.measure + lyricPart.start.beat / lyricPart.start.div <=
				currentMeasure &&
			currentMeasure <
				lyricPart.end.measure + lyricPart.end.beat / lyricPart.end.div,
	);
	if (currentLyric.length > 0) {
		if (currentLyric.some((lyricPart) => lyricPart.multi)) {
			const himariLyric = currentLyric.find(
				(lyricPart) => lyricPart.type === "himari",
			);
			const ttLyric = currentLyric.find((lyricPart) => lyricPart.type === "tt");

			if (himariLyric) {
				g.lyrics.textAlign(p.RIGHT, p.CENTER);
				g.lyrics.fill(himariFg);
				g.lyrics.text(himariLyric?.lyric ?? "", width / 2 - 64, height / 2);
			}
			if (ttLyric) {
				g.lyrics.textAlign(p.LEFT, p.CENTER);
				g.lyrics.fill(ttFg);
				g.lyrics.text(ttLyric?.lyric ?? "", width / 2 + 64, height / 2);
			}
		} else {
			const lyricPart = currentLyric[0];
			g.lyrics.textAlign(p.CENTER, p.CENTER);
			g.lyrics.fill(
				lyricPart.type === "himari"
					? himariFg
					: lyricPart.type === "tt"
						? ttFg
						: fg,
			);
			g.lyrics.text(lyricPart.lyric, width / 2, height / 2);
		}
	}
};

let shadowCache: p5.Graphics | null = null;

const getShadow = (p: p5) => {
	if (shadowCache === null) {
		shadowCache = p.createGraphics(width, height);
		for (let i = 0; i < shadowHeight; i++) {
			const alpha = p.map(i, 0, shadowHeight, 8, 0);
			shadowCache.stroke(0, 16, 64, alpha);
			shadowCache.line(
				0,
				height / 2 - barHeight / 2 - i,
				width,
				height / 2 - barHeight / 2 - i,
			);
			shadowCache.line(
				0,
				height / 2 + barHeight / 2 + i,
				width,
				height / 2 + barHeight / 2 + i,
			);
		}
	}

	return shadowCache;
};
