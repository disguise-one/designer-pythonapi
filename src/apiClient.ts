import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class PythonApiClient {
	private client: AxiosInstance;

	/**
	 * Registers a Python module with the server.
	 * @param moduleName - The name of the module to register.
	 * @param sourceCode - The Python source code for the module.
	 */
	constructor(endpoint: string, private moduleName: string, private sourceCode: string) {
		this.client = axios.create({
			baseURL: `http://${endpoint}/api/session/python/`,
			headers: { 'Content-Type': 'application/json' },
		});

	}

  
	async register() {
    return await this.client.post('registermodule', {
      moduleName: this.moduleName,
      contents: this.sourceCode
    });
	}

	/**
	 * Executes a Python script on the server.
	 * @param moduleName - The name of the module to execute the script in.
	 * @param script - The Python script to execute.
	 */
	async executeScript(script: string): Promise<any> {
		const response = await this.client.post('execute', {
			moduleName: this.moduleName,
			script,
		});
		return response.data;
	}
}

export default function apiClient() {
	// Placeholder implementation
	console.log('API Client initialized');
}
