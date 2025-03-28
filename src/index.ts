export { PythonApiClient } from './apiClient';
export { designerPythonLoader } from './designerPythonLoader';

import { defineConfig } from 'vite';
import { designerPythonLoader } from './designerPythonLoader';

export default defineConfig({
	plugins: [
		designerPythonLoader,
	],
});