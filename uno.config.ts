import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
	presets: [
		presetWind4({
			preflights: {
				property: {
					parent: false,
				},
			},
		}),
	],
	theme: {
		font: {
			sans: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
			syncopate: "Syncopate, sans-serif",
		},
	},
});
