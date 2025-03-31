# Designer Python API

A TypeScript library and Vite plugin to interact with Designer Python APIs. This project provides tools to transform Python code into JavaScript modules with TypeScript definitions, enabling seamless integration of Designer Python modules into JavaScript/TypeScript projects.

## Features

- **Python API Client**: Provides a client to interact with Python APIs via HTTP.
- **Python to JavaScript Transformation**: Converts Python functions into JavaScript modules.
- **TypeScript Definitions**: Automatically generates TypeScript type definitions for Python functions.
- **Vite Plugin**: Includes a Vite plugin for easy integration into Vite-based projects.

## Installation

Install the package using npm from GitHub:

```bash
npm install disguise-one/designer-pythonapi
```

## Usage

### Vite Plugin

To use the Vite plugin, add it to your Vite configuration, using the default options is recommended:

```ts
// vite.config.ts
import { designerPythonLoader } from '@disguise-one/designer-pythonapi/vite-loader';

export default {
  plugins: [
    designerPythonLoader(),
  ],
};
```

#### Loader options

The Vite plugin accepts the following options:

- **`generateJavascript`** (optional): A boolean indicating whether to generate JavaScript files from the Python modules. If set to `true`, the loader will write the generated JavaScript code to a `.js` file alongside the Python module. Defaults to `false`.

- **`generateTypeDefinitions`** (optional): A boolean indicating whether to generate TypeScript type definition files (`.d.ts`) for the Python modules. If set to `true`, the loader will create type definitions based on the parsed Python functions. Defaults to `true`.

Example configuration:

```ts
designerPythonLoader({
    generateJavascript: true,
    generateTypeDefinitions: true,
});
```

### Transforming Python Code

The plugin automatically transforms Python files (`.py`) into JavaScript modules during the build process. It uses the `__all__` variable to gather exported symbols from the file. Remember that Designer currently uses Python 2.7 syntax. For example, given the following Python code:

```python
# myfile.py
__all__ = ["venue_visibility"]

from d3 import resourceManager

def venue_visibility(show):
    cameraSettings = resourceManager.load('objects/stagerendersettings/visualiser.apx')
    cameraSettings.drawVenue = show
    return cameraSettings.drawVenue
```

The plugin intercepts import operations and provides a JavaScript module with corresponding TypeScript definitions which allow seamless access to the exported python functions.

```ts
import { ExecuteResponse } from '@disguise-one/designer-pythonapi'
import { myfile } from './myfile.py'

// Import the python file into the target Designer instance (usually provided as `?director=<host:port>` to plugins)
const { venue_visibility, registration } = myfile('director:port');

// Optionally check the result of registration - can be done asynchronously.
const registrationResult: RegistrationResponse = await registration;
if (registrationResult.status !== 0)
    throw Error("Failed to register 'myfile': " + registrationResult.message);

const result: ExecuteResponse = await venue_visibility(True);
const returnValue = JSON.parse(result.returnValue);
console.log(returnValue); // 3
```

### Python API Client

The `PythonApiClient` class allows you to interact with Python APIs directly, without using import magic. Example usage:

```ts
import { PythonApiClient } from '@disguise-one/designer-pythonapi';

const client = new PythonApiClient('localhost:8000', 'example', `
__all__ = ["add"]

def add(a, b):
    return a + b
`);

await client.register();
const result = await client.executeScript('return add(1, 2)');
console.log(result.returnValue); // Output: 3
```

## Development

### Building the Project

To build the project, run:

```bash
npm run build
```

### Running Tests

To run the test suite, use:

```bash
npm test
```

### Debugging

The project includes debugging configurations for both Node.js and Python. Use the provided `.vscode/launch.json` configurations to debug the Vite plugin or the Python parser.

## File Structure

- **`src/`**: Contains the TypeScript source code.
  - `vite-loader.ts`: Vite plugin for transforming Python code.
  - `apiClient.ts`: Python API client implementation.
- **`python_support/`**: Python scripts for parsing Python source code.
- **`tests/`**: Test cases for the library.
- **`dist/`**: Compiled output.

## License

This project is licensed under the MIT License.
