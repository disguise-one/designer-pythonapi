import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class PythonApiClient {
	private client: AxiosInstance;
	registerPromise: Promise<AxiosResponse<any>>;

	/**
	 * Registers a Python module with the server.
	 * @param moduleName - The name of the module to register.
	 * @param sourceCode - The Python source code for the module.
	 */
	constructor(endpoint: string, private moduleName: string, sourceCode: string) {
		this.client = axios.create({
			baseURL: `http://${endpoint}/api/session/python/`,
			headers: { 'Content-Type': 'application/json' },
		});

		this.registerPromise = this.client.post('registermodule', {
			moduleName,
			sourceCode,
		});
	}

	async register() {
		return await this.registerPromise;
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
