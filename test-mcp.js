import { createClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMcpServer() {
  const transport = new StdioClientTransport();
  const client = createClient(transport);

  try {
    await client.connect();

    // Example: Call the 'get_date' tool on the 'date-server'
    const result = await client.callTool({
      name: 'get_date',
      server: 'date-server',
      arguments: {},
    });

    console.log('Date server result:', result);

    await client.close();
  } catch (error) {
    console.error('Error testing MCP server:', error);
  }
}

testMcpServer();