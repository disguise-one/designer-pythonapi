import { PythonApiClient } from '../src/apiClient';
import http from 'http';
import { AddressInfo } from 'net';
import { describe, it, expect, afterEach } from 'vitest';

describe('PythonApiClient', () => {
  let server: http.Server | undefined;

  // A server that takes requests and never answers them.
  const silentServer = async () => {
    server = http.createServer(() => {});
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
    return `127.0.0.1:${(server.address() as AddressInfo).port}`;
  };

  afterEach(() => {
    server?.closeAllConnections();
    server?.close();
    server = undefined;
  });

  it('should give up on a request after the timeout it is given', async () => {
    const endpoint = await silentServer();
    const client = new PythonApiClient(endpoint, 'example', '', { timeout: 100 });

    const started = Date.now();
    await expect(client.register()).rejects.toMatchObject({ code: 'ECONNABORTED' });
    await expect(client.executeScript('return 1')).rejects.toMatchObject({ code: 'ECONNABORTED' });
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('should wait for an answer with no timeout given', async () => {
    const endpoint = await silentServer();
    const client = new PythonApiClient(endpoint, 'example', '');

    const outcome = await Promise.race([
      client.register().then(() => 'answered', () => 'gave up'),
      new Promise((resolve) => setTimeout(() => resolve('still waiting'), 300)),
    ]);
    expect(outcome).toEqual('still waiting');
  });
});
