import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

interface LoaderOptions {
  generateJavascript?: boolean;
  generateTypeDefinitions?: boolean;
}

const DEFAULT_LOADER_OPTIONS: LoaderOptions = {
  generateJavascript: false,
  generateTypeDefinitions: true,
};

interface FunctionDefinition {
  name: string;
  parameters: string[];
};

interface PythonModule {
  functions: FunctionDefinition[];
}

const generateExecuteFunction = (func: FunctionDefinition) => {
  return `\
  const ${func.name} = (${func.parameters.join(', ')}) => {
    const script = \`return ${func.name}(${func.parameters.map((param) => `\${JSON.stringify(${param})}`).join(', ')})\`;

    // Execute the script using the PythonApiClient
    return client.executeScript(script);
  };
`;
}


const generateJavaScriptCode = (moduleName: string, code: string, python: PythonModule) => {
  return `\
// Auto-generated from ${moduleName} by vite-plugin-designer-python-loader
import { PythonApiClient } from '@disguise-one/designer-pythonapi';

export const ${moduleName} = (directorEndpoint) => {
  const client = new PythonApiClient(directorEndpoint, "${moduleName}", ${JSON.stringify(code)});

  const registration = client.register();

${python.functions.map(generateExecuteFunction).join('\n')}

  return {
    client,
    registration,
    ${python.functions.map(({name}) => name).join(',\n    ')}
  };
};
`;
};

const generateTypeDefinitions = (moduleName: string, python: PythonModule) => {
  return `\
// Auto-generated from ${moduleName} by vite-plugin-designer-python-loader
import { AxiosResponse } from 'axios';
import { PythonApiClient, ExecuteResponse, RegisterResponse } from '@disguise-one/designer-pythonapi';

export declare const ${moduleName}: (directorEndpoint: string) => {
  client: PythonApiClient;
  registration: Promise<AxiosResponse<RegisterResponse>>;
${python.functions
  .map((func) => `  ${func.name}: (${func.parameters.map((p) => `${p}: any`).join(', ')}) => Promise<ExecuteResponse>;`)
  .join('\n')}
};
`;
};

export const designerPythonLoader = (options: LoaderOptions = {}) => {
  options = { ...DEFAULT_LOADER_OPTIONS, ...options };

  // Define __dirname for both CommonJS and ES module compatibility
  const localDirname: string = typeof __dirname !== 'undefined'
    ? __dirname // CommonJS
    : path.dirname(fileURLToPath(import.meta.url)); // ES module

  const parseScriptPath = path.resolve(localDirname, 'python_support/parse.py');

  const parsePython = (code: string) => {
    const parsedOutput = execSync(`python3 ${parseScriptPath}`, { input: code }).toString();

    const parsedJson = JSON.parse(parsedOutput);
    if (parsedJson.error) {
      throw new Error(`Import error: ${parsedJson.error}`);
    }

    return parsedJson as PythonModule;
  }

  return {
    name: 'vite-plugin-designer-python-loader',
    buildStart() {
      if (options.generateTypeDefinitions) {
      }
    },
    transform(code: string, id: string) {
      if (id.endsWith('.py')) {
        // Parse the Python code using the parse.py script
        const python = parsePython(code);

        const moduleName = id.replace(/\.py$/, '').split('/').pop() || 'module';

        const jsCode = generateJavaScriptCode(moduleName, code, python);

        // Write the JavaScript code to a file if generateJavascript is true
        if (options.generateJavascript) {
          const jsFilePath = `${id}.js`;
          fs.writeFileSync(jsFilePath, jsCode, 'utf-8');
        }

        // Generate TypeScript type definitions
        const typeDefinitions = generateTypeDefinitions(moduleName, python);
        if (options.generateTypeDefinitions) {
          const dtsFilePath = `${id}.d.ts`;
          fs.writeFileSync(dtsFilePath, typeDefinitions, 'utf-8');
        }

        return {
          code: jsCode,
          map: null, // No source map
          moduleSideEffects: false,
          meta: {
            typeDefinitions,
          },
        };
      }
    },
  };
};
