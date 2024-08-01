import type p5 from "p5";
import { fg, height, songLength, width } from "../const.ts";
import type { State } from "../state.ts";
import {
	getCurrentMeasure,
	getCurrentPageMeasure,
	getCurrentPart,
	measuresPerPage,
	midi,
} from "../midi.ts";
import type { Graphics } from "../draw.ts";
import chords_ from "../assets/chords.yml";

const chords = chords_ as Record<string, string>;

const separator = " │ ";

export const draw = (p: p5, g: Graphics, state: State) => {
	g.background.noStroke();
	g.background.fill(fg);
	g.background.textFont("M+ 2m Light");
	g.background.textSize(32);
	g.background.textAlign(p.LEFT, p.CENTER);
	g.background.textStyle(p.NORMAL);

	const page = getCurrentPageMeasure(state);
	const chordsInPage = Object.entries(chords).filter(
		([chordPage, _]) =>
			page <= Number(chordPage) - 1 &&
			Number(chordPage) - 1 < page + measuresPerPage,
	);

	g.background.text(
		`Chord: ${chordsInPage.map(([, chord]) => chord).join(" -> ") || "-"}`,
		32,
		height - 32,
	);

	const time = Math.min(state.currentFrame / 60, songLength);
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	const milliseconds = Math.floor((time % 1) * 100);
	const tick = midi.header.secondsToTicks(time);

	const part = getCurrentPart(state);

	const measure = getCurrentMeasure(state);

	const ended = measure >= 111;
	g.background.text(
		[
			`Time: ${
				ended
					? "02:06.60"
					: `${minutes.toString().padStart(2, "0")}:${seconds
							.toString()
							.padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
			} / 02:06.60`,
			`Frames: ${ended ? "---- " : state.currentFrame.toString().padStart(4)}`,
		].join(separator),
		32,
		32,
	);
	g.background.textAlign(p.RIGHT, p.CENTER);
	const currentTimeSig = midi.header.timeSignatures.findLast(
		({ ticks }) => ticks <= tick,
	);
	g.background.text(
		[
			`BPM: ${ended ? "---" : "200"}`,
			`Time Sig: ${
				ended
					? "-/-"
					: currentTimeSig
						? currentTimeSig.timeSignature.join("/")
						: "-"
			}`,
			`Key: ${ended ? "-" : "C"}`,
			`Scale: ${ended ? "-" : "Major"}`,
		].join(separator),
		width - 32,
		height - 32,
	);
	g.background.text(
		[
			`Part: ${part}`,
			`Ticks: ${ended ? 405120 : tick.toString().padStart(6)} (tpqn: ${midi.header.ppq})`,
			`Measure: ${ended ? 111 : measure.toFixed(2).padStart(6)}`,
		].join(separator),
		width - 32,
		32,
	);
};
