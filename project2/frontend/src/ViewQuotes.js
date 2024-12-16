import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const ViewQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuotes = async () => {
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('You must be logged in to view your quotes.');
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get('http://localhost:5001/quotes', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setQuotes(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch quotes.');
      }
    };

    fetchQuotes();
  }, [navigate]);

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: '#007bff', marginBottom: '20px' }}>My Quotes</h2>

      <nav style={{ textAlign: 'center', marginBottom: '20px' }}>
        <ul style={{ listStyleType: 'none', padding: '0', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <li><Link to="/dashboard" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff' }}>Dashboard</Link></li>
          <li><Link to="/profile" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff' }}>Profile</Link></li>
        </ul>
      </nav>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {quotes.length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: '0', fontSize: '1.1rem', color: '#555' }}>
          {quotes.map((quote) => (
            <li key={quote.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <strong>Address:</strong> {quote.address} <br />
              <strong>Status:</strong> {quote.status} <br />
              <strong>Proposed Price:</strong> ${quote.currentPrice} <br />
            </li>
          ))}
        </ul>
      ) : (
        !error && <p style={{ color: '#555', textAlign: 'center' }}>No quotes found.</p>
      )}
    </div>
  );
};

export default ViewQuotes;
