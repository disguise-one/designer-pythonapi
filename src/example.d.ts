// Auto-generated from example.py by vite-plugin-designer-python-loader
import { AxiosResponse } from 'axios';
import { PythonApiClient } from '@disguise-one/designer-pythonapi';

export declare const example: (directorEndpoint: string) => {
  client: PythonApiClient;
  registration: AxiosResponse<any>;
  add: (a: any, b: any) => any;
  subtract: (a: any, b: any) => any;
};
