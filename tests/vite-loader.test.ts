import { designerPythonLoader } from '../src/vite-loader';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { describe, it, expect } from 'vitest';

describe('designerPythonLoader', () => {
  const loader = designerPythonLoader({
    generateJavascript: false,
    generateTypeDefinitions: false,
  });
  it('should transform Python code into a JavaScript module with TypeScript definitions', () => {
    const pythonCode = `\
__all__ = ["add", "subtract"]
def add(a, b):
  return a + b
  
def subtract(a, b):
  return a - b`;
    const id = 'example.py';

    const result = loader.transform(pythonCode, id);

    expect(result).toBeDefined();
    expect(result?.code).toEqual(`\
// Auto-generated from example by vite-plugin-designer-python-loader
import { PythonApiClient } from '@disguise-one/designer-pythonapi';

export const example = (directorEndpoint) => {
  const client = new PythonApiClient(directorEndpoint, "example", "__all__ = [\\\"add\\\", \\\"subtract\\\"]\\ndef add(a, b):\\n  return a + b\\n  \\ndef subtract(a, b):\\n  return a - b");

  const registration = client.register();

  // Calls wait for registration, and register again if it failed.
  let registered = registration;
  const ready = () => registered.catch(() => (registered = client.register()));

  const add = async (a, b) => {
    const script = \`return add(\${JSON.stringify(a)}, \${JSON.stringify(b)})\`;

    // Execute the script using the PythonApiClient, once the module is registered
    await ready();
    return client.executeScript(script);
  };

  const subtract = async (a, b) => {
    const script = \`return subtract(\${JSON.stringify(a)}, \${JSON.stringify(b)})\`;

    // Execute the script using the PythonApiClient, once the module is registered
    await ready();
    return client.executeScript(script);
  };


  return {
    client,
    registration,
    add,
    subtract
  };
};
`);

    expect(result?.meta.typeDefinitions).toEqual(`\
// Auto-generated from example by vite-plugin-designer-python-loader
import { AxiosResponse } from 'axios';
import { PythonApiClient, ExecuteResponse, RegisterResponse } from '@disguise-one/designer-pythonapi';

export type addFunction = (a: any, b: any) => Promise<ExecuteResponse>;
export type subtractFunction = (a: any, b: any) => Promise<ExecuteResponse>;

export declare const example: (directorEndpoint: string) => {
  client: PythonApiClient,
  registration: Promise<AxiosResponse<RegisterResponse>>,
  add: addFunction,
  subtract: subtractFunction
};
`);
  });

  it('should compile the generated JavaScript code without errors', async () => {
    const pythonCode = `\
__all__ = ["add", "subtract"]
def add(a, b):
  return a + b
  
def subtract(a, b):
  return a - b`;
    const id = 'example.py';

    const result = loader.transform(pythonCode, id);

    expect(result).toBeDefined();

    // Save the generated JavaScript code to a temporary file in $TEMP
    const tempFilePath = path.resolve(os.tmpdir(), 'example.js');
    fs.writeFileSync(tempFilePath, result?.code || '', 'utf8');

    // Dynamically import the file to check if it can be loaded without errors
    const importedModule = await import(tempFilePath);
    expect(importedModule).toBeDefined();

    // Clean up
    fs.unlinkSync(tempFilePath);
  });

  // Loads the generated module with a stand-in PythonApiClient, whose
  // registrations wait for the test to resolve or reject them.
  const loadWithStandInClient = async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loader-calls-'));
    fs.writeFileSync(path.join(tempDir, 'client.mjs'), `\
export const events = [];
export const registrations = [];
export class PythonApiClient {
  register() {
    events.push('register');
    return new Promise((resolve, reject) => registrations.push({ resolve, reject }));
  }
  async executeScript(script) {
    events.push(script);
    return { returnValue: '3' };
  }
}`, 'utf8');
    const result = loader.transform(`\
__all__ = ["add"]
def add(a, b):
  return a + b`, 'example.py');
    const code = (result?.code || '').replace("'@disguise-one/designer-pythonapi'", "'./client.mjs'");
    fs.writeFileSync(path.join(tempDir, 'example.mjs'), code, 'utf8');
    const client = await import(path.join(tempDir, 'client.mjs'));
    const { example } = await import(path.join(tempDir, 'example.mjs'));
    fs.rmSync(tempDir, { recursive: true, force: true });
    return { module: example('localhost'), events: client.events, registrations: client.registrations };
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('should wait for the module to be registered before calling it', async () => {
    const { module, events, registrations } = await loadWithStandInClient();

    const call = module.add(1, 2);
    await settle();
    expect(events).toEqual(['register']);

    registrations[0].resolve({ status: { code: 0 } });
    expect(await call).toEqual({ returnValue: '3' });
    expect(events).toEqual(['register', 'return add(1, 2)']);
  });

  it('should register the module again when registering failed', async () => {
    const { module, events, registrations } = await loadWithStandInClient();

    // The first registration fails, so the call registers again and waits for that.
    const first = module.add(1, 2);
    registrations[0].reject(new Error('Network Error'));
    await settle();
    expect(events).toEqual(['register', 'register']);
    registrations[1].resolve({ status: { code: 0 } });
    expect(await first).toEqual({ returnValue: '3' });

    // Once registered, calls don't register again.
    await module.add(2, 3);
    expect(events).toEqual(['register', 'register', 'return add(1, 2)', 'return add(2, 3)']);
  });

  it('should fail a call whose registration failed again, and try once more on the next', async () => {
    const { module, events, registrations } = await loadWithStandInClient();

    const first = module.add(1, 2);
    registrations[0].reject(new Error('Network Error'));
    await settle();
    registrations[1].reject(new Error('Network Error'));
    await expect(first).rejects.toThrow('Network Error');

    const second = module.add(1, 2);
    await settle();
    expect(events).toEqual(['register', 'register', 'register']);
    registrations[2].resolve({ status: { code: 0 } });
    expect(await second).toEqual({ returnValue: '3' });
  });

  it('should define a valid Vite config with the plugin', async () => {
    const pythonCode = `\
__all__ = ["multiply"]
def multiply(a, b):
  return a * b`;
    const id = 'example.py';

    // Create a temporary directory for the Vite project
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-test-'));
    const tempPythonFile = path.join(tempDir, id);
    fs.writeFileSync(tempPythonFile, pythonCode, 'utf8');

    // Define a Vite configuration with the plugin
    const viteConfig = {
      root: tempDir,
      plugins: [loader],
    };

    // Dynamically import resolveConfig from Vite
    const { resolveConfig } = await import('vite');

    // Validate the Vite configuration
    const resolvedConfig = await resolveConfig(viteConfig, 'serve');
    expect(resolvedConfig).toBeDefined();
    expect(resolvedConfig.plugins.some(plugin => plugin.name === loader.name)).toBe(true);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate valid TypeScript definitions', async () => {
    const pythonCode = `\
__all__ = ["divide"]
def divide(a, b):
  return a / b`;
    const id = 'example.py';

    const result = loader.transform(pythonCode, id);

    expect(result).toBeDefined();
    expect(result?.meta.typeDefinitions).toBeDefined();

    // Save the generated TypeScript definitions to a temporary file in $TEMP
    const tempFilePath = path.resolve(os.tmpdir(), 'example.d.ts');
    fs.writeFileSync(tempFilePath, result?.meta.typeDefinitions || '', 'utf8');

    // Use the TypeScript compiler to validate the definitions
    const ts = await import('typescript');
    const program = ts.createProgram([tempFilePath], {
      noEmit: true,
      paths: {
        '@disguise-one/designer-pythonapi': [path.resolve(__dirname, '../src')],
        'axios': [path.resolve(__dirname, '../node_modules/axios')],
      },
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);

    // Format diagnostics into a readable string
    const diagnosticMessages = diagnostics.map(diagnostic => {
      const { file, start, messageText } = diagnostic;
      const position = file && start !== undefined ? file.getLineAndCharacterOfPosition(start) : null;
      const filePath = file?.fileName || 'unknown file';
      const line = position ? position.line + 1 : 'unknown line';
      const message = ts.flattenDiagnosticMessageText(messageText, '\n');
      return `Error in ${filePath} at line ${line}: ${message}`;
    }).join('\n');

    // Ensure there are no TypeScript errors, include diagnostic messages if any
    expect(diagnostics.length, diagnosticMessages).toEqual(0);

    // Clean up
    fs.unlinkSync(tempFilePath);
  });
});
