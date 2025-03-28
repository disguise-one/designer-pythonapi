import { defineConfig } from 'vite';
import { designerPythonLoader } from './src/designerPythonLoader';

export default defineConfig({
	plugins: [
		designerPythonLoader,
	],
});