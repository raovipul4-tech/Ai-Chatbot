import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (rootElement) {
    try {
        const root = ReactDOM.createRoot(rootElement);
        root.render(<App />);
    } catch (error) {
        console.error("Mount Error:", error);
        rootElement.innerHTML = `<div style="padding:20px; color:red">Error loading application: ${error}</div>`;
    }
}