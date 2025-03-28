import { execSync } from 'child_process';
import { PythonApiClient } from './apiClient';
import path from 'path';

export const generateExecuteFunction = (client: PythonApiClient, name: string, parameters: string[]) => {
  return (...args: any[]) => {
    if (args.length !== parameters.length) {
      throw new Error(`Expected ${parameters.length} arguments, but got ${args.length}`);
    }

    // Convert args to python syntax
    const argsString = parameters
      .map((param, index) => {
        return JSON.stringify(args[index]);
      })
      .join(', ');
    const script = `${name}(${argsString})`;

    // Execute the script using the PythonApiClient
    return client.executeScript(script);
  };
};

export const designerPythonLoader = {
  name: 'vite-plugin-designer-python-loader',
  transform(code: string, id: string) {
    if (id.endsWith('.py')) {
      // Parse the Python code using the parse.py script
      const parseScriptPath = path.resolve(__dirname, '../python_support/parse.py');
      const parsedOutput = execSync(`python3 ${parseScriptPath}`, { input: code }).toString();

      const parsedJson = JSON.parse(parsedOutput);
      if (parsedJson.error) {
        throw new Error(`Import error: ${parsedJson.error}`);
      }

      const functions = parsedJson.functions;
      const moduleName = id.replace(/\.py$/, '').split('/').pop() || 'module';

      // Generate TypeScript code
      const functionEntries = functions
        .map(
          (func: { name: string; parameters: string[] }) =>
            `    ${func.name}: generateExecuteFunction(client, "${func.name}", ${JSON.stringify(func.parameters)}),`
        )
        .join('\n');

      const tsCode = `\
// Auto-generated from ${id}
import { executeFunction } from './designerPythonLoader';
import { PythonClientApi } from './apiClient';

export const ${moduleName} = (directorEndpoint: string) => {
  const client = new PythonClientApi(directorEndpoint, "${moduleName}", ${JSON.stringify(code)});

  return {
    client,
${functionEntries}
  };
};
`;
      return {
        code: tsCode,
        map: null, // No source map
      };
    }
  },
};
