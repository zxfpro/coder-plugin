import React from 'react';
import ReactDOM from 'react-dom';

const App: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <h1 style={{ color: '#333', fontSize: '2rem', marginBottom: '1rem' }}>
                Design Mirror
            </h1>
            <p style={{ color: '#666', fontSize: '1rem' }}>
                Welcome to the Design Mirror application!
            </p>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
                <p style={{ color: '#333' }}>
                    This is a simple React application that connects to the backend API.
                </p>
            </div>
        </div>
    );
};

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('app')
);