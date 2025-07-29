import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  // State variable to store the message from the backend
  const [message, setMessage] = useState('');

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    // Fetch data from our backend API endpoint
    fetch('http://localhost:5000/api' )
      .then(response => response.json())
      .then(data => {
        // Update the state with the message from the backend
        setMessage(data.message);
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error);
      });
  }, []); // The empty array [] means this effect runs only once

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        {/* Display the message from the backend here */}
        <p style={{ marginTop: '20px', color: '#61dafb' }}>
          <strong>Message from Backend:</strong> {message || "Loading..."}
        </p>
      </header>
    </div>
  );
}

export default App;
