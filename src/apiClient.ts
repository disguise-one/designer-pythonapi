import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface RpcStatus {
  code: number;
  message: string;
  details: any[];
}

export interface ExecuteResponse {
  status: RpcStatus;
  d3Log: string;
  pythonLog: string;
  returnValue: string;
}

export interface RegisterResponse {
  status: RpcStatus;
}

export interface PythonApiClientOptions {
  /** How long to wait for Designer to answer a request before giving up on it, in milliseconds. Defaults to no limit. */
  timeout?: number;
}

export class PythonApiClient {
	private client: AxiosInstance;

	/**
	 * Registers a Python module with the server.
	 * @param moduleName - The name of the module to register.
	 * @param sourceCode - The Python source code for the module.
	 * @param options - Optional settings for the requests to Designer.
	 */
	constructor(endpoint: string, private moduleName: string, private sourceCode: string, options: PythonApiClientOptions = {}) {
		this.client = axios.create({
			baseURL: `http://${endpoint}/api/session/python/`,
			headers: { 'Content-Type': 'application/json' },
			timeout: options.timeout,
		});

	}

  
	async register() {
    return await this.client.post<RegisterResponse>('registermodule', {
      moduleName: this.moduleName,
      contents: this.sourceCode
    });
	}

	/**
	 * Executes a Python script on the server.
	 * @param moduleName - The name of the module to execute the script in.
	 * @param script - The Python script to execute.
	 */
	async executeScript(script: string) {
		const response = await this.client.post<ExecuteResponse>('execute', {
			moduleName: this.moduleName,
			script,
		});
		return response.data;
	}
}
