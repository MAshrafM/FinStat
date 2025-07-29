// Import the Express library
const express = require('express');
const cors = require('cors');

// Create an instance of an Express application
const app = express();

// This enables CORS for all routes, allowing our frontend to make requests
app.use(cors()); 

// Define the port the server will run on. 
// We use 5000 for the backend to avoid conflict with the React frontend (which usually runs on 3000)
const PORT = 5000;

// Define a simple "route" or "endpoint"
// This tells the server what to do when it receives a GET request to the main URL ("/")
app.get('/api', (req, res) => {
  // Send a JSON response back to the client
  res.json({ message: "Hello from the backend server!" });
});

// Start the server and make it listen for incoming requests on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}` );
});
