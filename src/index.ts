// Import the MCP server class and resource template for creating an MCP server
import {McpServer, ResourceTemplate} from '@modelcontextprotocol/sdk/server/mcp.js';
// Import stdio transport for communication via standard input/output
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
// Import zod for schema validation and type checking
import {z} from 'zod';
// Import package.json file to get project name and version
import pks from '../package.json' with {type: 'json'};
// Import MIMEType utility (currently unused in the code)
import { MIMEType } from 'util';

// Extract name and version from the imported package.json
const {name, version} = pks;
// Get API_BASE_URL from environment variables for external API calls
// Get API_BASE_URL from environment variables for external API calls
const {API_BASE_URL} = process.env;

// Create a new MCP server instance with configuration
const server = new McpServer({
  // Set the server name from package.json
  name: name,
  // Set the server version from package.json
  version: version,
  // Define server capabilities - what features this server supports
  capabilities: {
    // Enable resource capabilities (for serving documents/data)
    resource: {},
    // Enable prompt capabilities (for serving prompt templates)
    prompts: {},
    // Enable tool capabilities (for providing executable functions)
    Tools: {},
  },
});

// Define a tool for listing products from the API
server.tool(
    'list-prouducts', // Tool name identifier (note: typo in 'prouducts')
    "List products", // Human-readable description of what this tool does
    // Tool function that executes when the tool is called
    async () => {
        try {
            // Make HTTP GET request to the API products endpoint
            const req= await fetch(`${API_BASE_URL}/products`); // Fetch the data from the API
            // Parse the JSON response from the API
            const data = await req.json(); // Parse the JSON response
        // Return successful response with formatted data
        return {
            // Content array containing the response data
            content:[
                {
                    // Specify content type as text
                    type: 'text',
                    // Convert JSON data to formatted string for display
                    text: JSON.stringify(data), // Convert the data to a string
                }
            ]
        };
    // Handle any errors that occur during API call
    } catch (error) {
        // Return error response with error message
        return {
            // Content array containing error information
            content: [
                {
                    // Specify content type as text
                    type: 'text',
                    // Convert error to string for display
                    text: `Error: ${error}`, // Convert the data to a string
                }
            ]
        };
    }
}

);

// Define a tool for getting a specific product by ID
server.tool(
    'get-product', // Tool name identifier
    "Get product", // Human-readable description of the tool functionality
    {id:z.string()}, // Input schema validation - requires an 'id' parameter as string
    // Tool function that executes when called with validated parameters
    async ({id}) => {
        try {
            // Make HTTP GET request to fetch specific product by ID
            const req= await fetch(`${API_BASE_URL}/products/${id}`); // Fetch the data from the API
            // Parse the JSON response into JavaScript object
            const data = await req.json(); // Parse the JSON response
        // Return successful response with product data
        return {
            // Content array containing the response data
            content:[
                {
                    // Specify response content type as plain text
                    type: 'text',
                    // Convert product data object to JSON string
                    text: JSON.stringify(data), // Convert the data to a string
                }
            ]
        };
    // Handle any errors that occur during the API request
    } catch (error) {
        // Return error response with error details
        return {
            // Content array containing error information
            content: [
                {
                    // Specify error content type as plain text
                    type: 'text',
                    // Convert error object to readable string format
                    text: `Error: ${error}`, // Convert the data to a string
                }
            ]
        };
    }
});


// Define a tool for adding a new product to the API
server.tool(
    'add-product', // Tool name identifier
    "Add product", // Human-readable description of the tool functionality
    // Input schema validation - requires name, price, and description parameters
    {name:z.string(), price:z.number(), description:z.string()},
    // Tool function that executes when called with validated parameters
    async ({name, price, description}) => {
        try {
            // Make HTTP POST request to create a new product
            const req= await fetch(`${API_BASE_URL}/products`, {
                method: 'POST', // Set HTTP method to POST for creating data
                headers: {
                    'Content-Type': 'application/json', // Specify JSON content type
                },
                // Convert product data to JSON string for request body
                body: JSON.stringify({name, price, description}),
            }); // Fetch the data from the API
            // Parse the JSON response from the API
            const data = await req.json(); // Parse the JSON response
        // Return successful response with created product data
        return {
            // Content array containing the response data
            content:[
                {
                    // Specify response content type as plain text
                    type: 'text',
                    // Convert response data to formatted JSON string
                    text: JSON.stringify(data), // Convert the data to a string
                }
            ]
        };
    // Handle any errors that occur during the API request
    } catch (error) {
        // Return error response with error details
        return {
            // Content array containing error information
            content: [
                {
                    // Specify error content type as plain text
                    type: 'text',
                    // Convert error object to readable string format
                    text: `Error: ${error}`, // Convert the data to a string
                }
            ]
        };
    }
}
);

// Define a resource for providing shopping policy documentation
server.resource(
  "Shopping Policy", // Human-readable name for the resource
  "docs:///policy/shopping.md", // URI identifier for the resource
  // Async function that returns the resource content when requested
  async (uri) => {
    try {
      // Import Node.js built-in modules for file operations
      const { fileURLToPath } = await import("url"); // Convert file URL to path
      const path = await import("path"); // Path manipulation utilities
      const { readFile } = await import("fs/promises"); // Async file reading
      // Get the current file's path and convert to directory path
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      // Construct path to data directory relative to current file
      const __fileDirectory = path.join(__dirname, '../data');
      // Build full path to the shopping policy markdown file
      const filePath = path.join(__fileDirectory, "shopping-policy.md");

      // Read the file content as UTF-8 text
      const data = await readFile(filePath, "utf8");

      // Return successful response with file content
      return {
        contents: [
          {
            uri: uri.href, // Original URI that was requested
            mimeType: "text/markdown", // Specify content type as Markdown
            text: data, // The actual file content
          },
        ],
      }
    // Handle any errors during file reading
    } catch {
      // Return error response if file cannot be read
      return {
        contents: [
          {
            uri: uri.href, // Original URI that was requested
            text: "Unable to load resource", // Error message
          },
        ],
      }
    }
  }
);

// Define a dynamic resource template for FAQ content
server.resource(
  "faq", // Resource name identifier
  new ResourceTemplate("faqs://{q}", { list: undefined }), // URI template with parameter 'q'
  // Async function that handles FAQ requests based on query parameter
  async (uri, { q }) => {
    // Default content for the FAQ response
    let content = 'register';

    // Check if the query is about login and provide specific content
    if (q === 'login') {
      content = 'How I can sign in'
    }

    // Check if the query is about checkout and provide specific content
    if (q === 'checkout') {
      content = 'How I can checkout cart'
    }

    // Check if the query is about cart and provide specific content
    if (q === 'cart') {
      content = 'How I can add product to cart'
    }

    // Return the FAQ content in the expected format
    return {
      contents: [{
        uri: uri.href, // Original URI that was requested
        text: content // The FAQ content based on the query
      }]
    }  });

  // Define a prompt template for welcoming customers
  server.prompt(
  "customer-welcome", // Prompt name identifier
  "Welcome a new customer", // Human-readable description of the prompt
  { name: z.string(), style: z.string() }, // Input schema - requires name and style parameters
  // Function that generates the prompt messages based on input parameters
  ({ name, style }) => ({
    messages: [{ // Array of messages for the conversation
      role: "user", // Message sender role
      content: {
        type: "text", // Content type specification
        text: `Please welcome our new customer ${name} in ${style} style.`, // Template message with parameters
      }
    }]
  })
);

// Start the MCP server with error handling
try {
    // Create a new STDIO transport for communication
    const transport = new StdioServerTransport();
    // Connect the server to the transport layer
    await server.connect(transport);
    // Log successful server startup
    console.log(`Server started `);
// Handle any errors that occur during server startup
} catch (error) {
    // Log error message to console
    console.error('Error starting server');
    // Exit the process with error code 1
    process.exit(1);
}