import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';

export default [
	{
		input: 'src/index.ts',
		output: {
			file: 'dist/index.js',
			format: 'es',
		},
		plugins: [
			resolve(),
			commonjs(),
			typescript()
		],
		external: [
			'axios'
		],
	},
	{
		input: 'src/vite-loader.ts',
		output: {
			file: 'dist/vite-loader.js',
			format: 'es',
		},
		plugins: [
			resolve(),
			commonjs(),
			typescript(),
			copy({
				targets: [
					{ src: 'src/python_support/**/*', dest: 'dist/python_support' }
				]
			}),
		],
		external: [],
	},
	{
		input: 'dist/types/index.d.ts',
		output: {
			file: 'dist/index.d.ts',
			format: 'es',
		},
		plugins: [dts()],
	},
	{
		input: 'dist/types/vite-loader.d.ts',
		output: {
			file: 'dist/vite-loader.d.ts',
			format: 'es',
		},
		plugins: [dts()],
	},
];
