import { defineConfig } from "vite";
import hmrify from "vite-plugin-hmrify";
import yaml from "@rollup/plugin-yaml";

export default defineConfig({
	plugins: [hmrify(), yaml()],
	server: {
		port: 12001,
	},
});
