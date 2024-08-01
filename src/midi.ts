import { Midi } from "@tonejs/midi";
import data from "./assets/main.mid?url";
import type { State } from "./state.ts";
import { songLength } from "./const.ts";

export const midi = await Midi.fromUrl(data);
midi.tracks = midi.tracks.filter((track) => !track.name.startsWith("#"));

const parts = {
	"1-5": "-",
	"5-29": "Intro",
	"29-61": "Verse",
	"61-79": "Bridge",

	"79-111": "Chorus",
	"111-9999": "-",
} as const;

type Part = (typeof parts)[keyof typeof parts];

export const getCurrentTick = (state: State): number => {
	const time = Math.min(state.currentFrame / 60, songLength);
	const tick = midi.header.secondsToTicks(time);
	return tick;
};
export const getCurrentMeasure = (state: State): number => {
	const measure = midi.header.ticksToMeasures(getCurrentTick(state)) + 1;
	return measure;
};
export const getCurrentPart = (state: State): Part => {
	const measure = getCurrentMeasure(state);
	const part = Object.entries(parts).find(([range]) => {
		const [start, end] = range.split("-").map(Number);
		return start <= measure && measure < end;
	});

	if (!part) {
		throw new Error(`Part not found for measure ${measure}`);
	}
	return part[1];
};

export const trackMeasures = midi.tracks.map((track) => {
	const measures = new Set(
		track.notes.flatMap((note) => {
			const start = Math.floor(midi.header.ticksToMeasures(note.ticks));
			const end = Math.floor(
				midi.header.ticksToMeasures(note.ticks + note.durationTicks - 1),
			);

			return Array.from({ length: end - start + 1 }, (_, i) => start + i);
		}),
	);

	return measures;
});

const pageStarts = [0, 78];
export const measuresPerPage = 4;
export const getCurrentPageMeasure = (state: State): number => {
	const currentMeasure = getCurrentMeasure(state) - 1;
	const lastPageStart =
		pageStarts.findLast((page) => page <= currentMeasure) ?? 0;

	const page =
		Math.floor((currentMeasure - lastPageStart) / measuresPerPage) *
			measuresPerPage +
		lastPageStart;

	return page;
};
