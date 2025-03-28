// Auto-generated from example.py
import { PythonApiClient } from '@disguise-one/designer-pythonapi';

export const example = async (directorEndpoint) => {
  const client = new PythonApiClient(directorEndpoint, "example", "__all__ = [\"add\", \"subtract\"]\ndef add(a, b):\n  return a + b\n  \ndef subtract(a, b):\n  return a - b");

  const registration = await client.register();

  const add = (a, b) => {
    const script = `return add(${JSON.stringify(a)}, ${JSON.stringify(b)})`;

    // Execute the script using the PythonApiClient
    return client.executeScript(script);
  };

  const subtract = (a, b) => {
    const script = `return subtract(${JSON.stringify(a)}, ${JSON.stringify(b)})`;

    // Execute the script using the PythonApiClient
    return client.executeScript(script);
  };


  return {
    client,
    registration,
    add,
    subtract
  };
};
