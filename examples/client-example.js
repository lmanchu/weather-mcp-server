#!/usr/bin/env node

/**
 * MCP Client Example
 *
 * This example demonstrates how to programmatically interact with the Weather MCP Server.
 * Use this as a reference for building your own MCP clients or for testing the server.
 *
 * @author IrisGo.AI
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple MCP Client
 *
 * Connects to an MCP server via stdio and allows sending requests
 */
class MCPClient {
  constructor(serverPath) {
    this.serverPath = serverPath;
    this.process = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Start the MCP server process
   */
  async start() {
    return new Promise((resolve, reject) => {
      console.log('Starting MCP server...');

      this.process = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let serverReady = false;

      // Handle server output
      this.process.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());

        lines.forEach(line => {
          try {
            const response = JSON.parse(line);
            this.handleResponse(response);
          } catch (e) {
            console.error('Failed to parse response:', line);
          }
        });
      });

      // Handle server errors
      this.process.stderr.on('data', (data) => {
        const message = data.toString();
        console.error('[Server]', message);

        if (message.includes('running on stdio')) {
          serverReady = true;
          resolve();
        }
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      this.process.on('exit', (code) => {
        console.log(`Server exited with code ${code}`);
      });

      // Timeout if server doesn't start
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server failed to start within timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Stop the MCP server
   */
  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Send a request to the MCP server
   */
  async request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      // Store the pending request
      this.pendingRequests.set(id, { resolve, reject });

      // Send to server
      this.process.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Handle response from server
   */
  handleResponse(response) {
    const { id, result, error } = response;

    if (this.pendingRequests.has(id)) {
      const { resolve, reject } = this.pendingRequests.get(id);
      this.pendingRequests.delete(id);

      if (error) {
        reject(new Error(error.message || 'Unknown error'));
      } else {
        resolve(result);
      }
    }
  }

  /**
   * List available tools
   */
  async listTools() {
    return this.request('tools/list');
  }

  /**
   * Call a tool
   */
  async callTool(name, args) {
    return this.request('tools/call', { name, arguments: args });
  }
}

/**
 * Main test function
 */
async function main() {
  const serverPath = join(__dirname, '..', 'index.js');
  const client = new MCPClient(serverPath);

  try {
    // Start server
    await client.start();
    console.log('✅ Server started successfully\n');

    // Test 1: List available tools
    console.log('=== Test 1: List Available Tools ===');
    const toolsList = await client.listTools();
    console.log('Available tools:');
    toolsList.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('✅ Test 1 passed\n');

    // Test 2: Get current weather for Taipei
    console.log('=== Test 2: Get Current Weather (Taipei) ===');
    const taipeiWeather = await client.callTool('get_current_weather', {
      city: 'Taipei',
      units: 'metric',
    });
    console.log(taipeiWeather.content[0].text);
    console.log('✅ Test 2 passed\n');

    // Test 3: Get current weather for New York (imperial units)
    console.log('=== Test 3: Get Current Weather (New York, Imperial) ===');
    const nyWeather = await client.callTool('get_current_weather', {
      city: 'New York',
      units: 'imperial',
    });
    console.log(nyWeather.content[0].text);
    console.log('✅ Test 3 passed\n');

    // Test 4: Get 5-day forecast for Tokyo
    console.log('=== Test 4: Get 5-Day Forecast (Tokyo) ===');
    const tokyoForecast = await client.callTool('get_weather_forecast', {
      city: 'Tokyo',
      units: 'metric',
    });
    console.log(tokyoForecast.content[0].text);
    console.log('✅ Test 4 passed\n');

    // Test 5: Error handling - invalid city
    console.log('=== Test 5: Error Handling (Invalid City) ===');
    try {
      await client.callTool('get_current_weather', {
        city: 'InvalidCityName12345',
        units: 'metric',
      });
      console.log('❌ Test 5 failed: Should have thrown an error');
    } catch (error) {
      console.log('Expected error:', error.message);
      console.log('✅ Test 5 passed\n');
    }

    // Test 6: Multiple concurrent requests
    console.log('=== Test 6: Concurrent Requests ===');
    const cities = ['London', 'Paris', 'Berlin', 'Madrid', 'Rome'];
    const startTime = Date.now();

    const promises = cities.map(city =>
      client.callTool('get_current_weather', { city, units: 'metric' })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`Fetched weather for ${cities.length} cities in ${duration}ms`);
    results.forEach((result, index) => {
      const lines = result.content[0].text.split('\n');
      console.log(`  ${cities[index]}: ${lines[1]}`); // Print temperature line
    });
    console.log('✅ Test 6 passed\n');

    // Summary
    console.log('=== Summary ===');
    console.log('✅ All tests passed!');
    console.log('MCP server is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Clean up
    client.stop();
    console.log('\nServer stopped.');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPClient };
