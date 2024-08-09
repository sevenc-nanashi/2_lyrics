import {
	getCurrentPageMeasure,
	getCurrentTick,
	measuresPerPage,
	midi,
	trackMeasures,
} from "../midi.ts";
import _tracks from "../assets/tracks.yml";
import type p5 from "p5";
import type { Graphics } from "../draw.ts";
import type { State } from "../state.ts";
import { barHeight, fg, height, statusHeight, width } from "../const.ts";

const trackInstruments = _tracks as {
	type: "chord" | "drum" | "melody" | "melody2";
	hide: boolean;
	instruments: string[];
}[];

const colors = {
	chord: [128, 128, 192],
	bass: [192, 128, 128],
	drum: [192, 192, 192],
	melody: [128, 192, 128],
	melody2: [192, 192, 128],
};

export const draw = (p: p5, g: Graphics, state: State) => {
	const currentTick = getCurrentTick(state);
	const currentMeasure = midi.header.ticksToMeasures(currentTick);
	const page = getCurrentPageMeasure(state);

	if (currentMeasure >= 110) {
		g.pianoRoll.textSize(64);
		g.pianoRoll.textFont("M+ 2m Thin");
		g.pianoRoll.fill(fg);

		const upperY = (height - barHeight - statusHeight * 2) / 4 + 48;
		g.pianoRoll.textAlign(p.CENTER, p.BOTTOM);
		g.pianoRoll.text("2>lyrics.txt", width / 2, upperY);

		g.pianoRoll.textAlign(p.CENTER, p.TOP);
		g.pianoRoll.textSize(48);
		g.pianoRoll.text(
			"Compose / Lyrics / Movie: Nanashi.",
			width / 2,
			upperY + 16,
		);

		const lowerY =
			((height - barHeight - statusHeight * 2) / 4) * 3 +
			statusHeight +
			barHeight;

		g.pianoRoll.textAlign(p.CENTER, p.CENTER);
		g.pianoRoll.textSize(32);
		g.pianoRoll.text(
			[
				"Vocals: Meimei Himari, NurseRobo_TypeT (Voicevox)",
				"Movie: Vite / p5.js / TypeScript | DAW: Reaper",
			].join("\n"),
			width / 2,
			lowerY,
		);

		return;
	}

	const playingTracks = midi.tracks
		.map((track, i) => [track, i] as const)
		.filter(([track, i]) => {
			if (trackInstruments[i].hide) {
				return false;
			}
			const measures = trackMeasures[i];
			return measures.has(Math.floor(currentMeasure));
		});
	if (playingTracks.length === 0) {
		return;
	}
	const availableHeight = height - barHeight - statusHeight * 2;
	const trackHeight =
		availableHeight / (Math.ceil(playingTracks.length / 2) * 2);

	const changingPoint = Math.ceil(playingTracks.length / 2);

	for (const [i, [track, ti]] of playingTracks.entries()) {
		const instruments = trackInstruments[ti];
		let trackY: number;
		if (playingTracks.length === 1) {
			trackY = statusHeight;
		} else {
			if (i < changingPoint) {
				trackY = statusHeight + trackHeight * i;
			} else {
				if (instruments.type === "drum") {
					trackY =
						statusHeight +
						barHeight +
						trackHeight * (i + (playingTracks.length % 2 === 0 ? 0 : 1));
				} else {
					trackY = statusHeight + barHeight + trackHeight * i;
				}
			}
		}
		const currentNotes = track.notes.filter((note) => {
			const start = Math.floor(midi.header.ticksToMeasures(note.ticks));
			const end = Math.floor(
				midi.header.ticksToMeasures(note.ticks + note.durationTicks - 1),
			);

			return start <= page + measuresPerPage && page <= end;
		});
		const [minNote, maxNote] = currentNotes.reduce(
			([min, max], note) => [
				Math.min(min, note.midi + 1),
				Math.max(max, note.midi + 1),
			],
			[127, 0],
		);
		const minNoteOctave = Math.ceil(minNote / 12);
		const minNoteOctaveNumber = minNoteOctave * 12;
		const maxNoteOctave = Math.ceil(maxNote / 12);
		const maxNoteOctaveNumber = maxNoteOctave * 12;

		const noteHeight = trackHeight / ((maxNoteOctave - minNoteOctave + 1) * 12);
		for (const note of currentNotes) {
			const noteMeasure = midi.header.ticksToMeasures(note.ticks);
			const noteEndMeasure = midi.header.ticksToMeasures(
				note.ticks + note.durationTicks - 1,
			);

			const x = ((noteMeasure - page) / measuresPerPage) * width;
			const y = trackY + (maxNoteOctaveNumber - note.midi - 1) * noteHeight;
			const x2 = ((noteEndMeasure - page) / measuresPerPage) * width;

			g.pianoRoll.stroke([...colors[instruments.type], 64]);
			g.pianoRoll.noFill();
			g.pianoRoll.rect(x, y, x2 - x, noteHeight);

			const progress = Math.min(
				1,
				(currentTick - note.ticks) / note.durationTicks,
			);
			if (progress < 0) {
				continue;
			}

			g.pianoRoll.fill(colors[instruments.type]);
			g.pianoRoll.noStroke();
			g.pianoRoll.rect(x, y, (x2 - x) * easeOutQuint(progress), noteHeight);
		}

		g.pianoRoll.noStroke();
		g.pianoRoll.fill(fg);
		g.pianoRoll.textSize(24);
		g.pianoRoll.textFont("M+ 2m Thin");
		g.pianoRoll.textAlign(p.LEFT, p.TOP);

		g.pianoRoll.stroke(fg);
		g.pianoRoll.strokeWeight(1);
		g.pianoRoll.noFill();
		g.pianoRoll.rect(-16, trackY, width + 32, trackHeight);
		g.pianoRoll.text(instruments.instruments.join(" / "), 16, trackY + 16);
	}
};
function easeOutQuint(x: number): number {
	return 1 - (1 - x) ** 5;
}
