import { designerPythonLoader } from '../src/designerPythonLoader';

describe('designerPythonLoader', () => {
  it('should transform Python code into a TypeScript module', () => {
		const pythonCode = `\
__all__ = ["add", "subtract"]
def add(a, b):
	return a + b
	
def subtract(a, b):
	return a - b`;
		const id = 'example.py';

		const result = designerPythonLoader.transform(pythonCode, id);

		expect(result).toBeDefined();
    expect(result?.code).toEqual(`\
// Auto-generated from example.py
import { executeFunction } from './designerPythonLoader';
import { PythonClientApi } from './apiClient';

export const example = (directorEndpoint: string) => {
  const client = new PythonClientApi(directorEndpoint, "example", "__all__ = [\\\"add\\\", \\\"subtract\\\"]\\ndef add(a, b):\\n\\treturn a + b\\n\\t\\ndef subtract(a, b):\\n\\treturn a - b");

  return {
    client,
    add: generateExecuteFunction(client, "add", ["a","b"]),
    subtract: generateExecuteFunction(client, "subtract", ["a","b"]),
  };
};
`);
	});
});
