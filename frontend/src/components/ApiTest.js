import React, { useState } from 'react';

export default function ApiTest() {
  const [result, setResult] = useState('');

  const testApi = async () => {
    try {
      console.log('Testing API connection...');
      const response = await fetch('http://localhost:3000/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-frontend-user',
          subscriptionPlan: 'free',
          email: 'test@frontend.com',
          displayName: 'Frontend Test User'
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      setResult(`Success: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('API test error:', error);
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>API Test</h3>
      <button onClick={testApi}>Test API Connection</button>
      <div style={{ marginTop: '10px' }}>
        <strong>Result:</strong> {result}
      </div>
    </div>
  );
}
