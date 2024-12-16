import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './styles.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    squareFeet: '',
    price: '',
    note: '',
  });
  const [quotes, setQuotes] = useState([]);
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch Quotes and Bills on Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [quotesRes, billsRes] = await Promise.all([
          axios.get('http://localhost:5000/quotes', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/bills', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setQuotes(quotesRes.data);
        setBills(billsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data.');
      }
    };

    fetchData();
  }, [navigate]);

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Update Quote Status
  const handleStatusUpdate = async (requestid, newStatus) => {
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/update-quote-status',
        { requestid, newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);

      // Update the quote status in the UI
      setQuotes((prev) =>
        prev.map((quote) =>
          quote.requestid === requestid ? { ...quote, status: newStatus } : quote
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quote status.');
    }
  };

  // Pay Bill
  const handlePayBill = async (billid) => {
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/pay-bill',
        { billid },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message);

      // Update the bill status in the UI
      setBills((prev) =>
        prev.map((bill) =>
          bill.billid === billid ? { ...bill, status: 'agreed' } : bill
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to pay the bill.');
    }
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle Submit Quote
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to submit a request.');
      navigate('/login');
      return;
    }

    const formDataToSend = {
      address: formData.address,
      drivewaysize: formData.squareFeet,
      price: formData.price,
      note: formData.note,
    };

    try {
      const res = await axios.post('http://localhost:5000/submit-quote', formDataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    }
  };

  return (
    <div className="container">
      <h2 className="heading-main">User Dashboard</h2>

      <nav>
        <ul className="nav-list">
          <li><Link to="/" className="nav-link">Home</Link></li>
          <li><Link to="/profile" className="nav-link">Profile</Link></li>
          <li>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </li>
        </ul>
      </nav>

      {/* Submit Quote Section */}
      <section className="section">
        <h3 className="section-heading">Submit New Quote</h3>
        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <label>Square Feet:</label>
          <input
            type="number"
            name="squareFeet"
            value={formData.squareFeet}
            onChange={handleChange}
            required
          />
          <label>Proposed Price:</label>
          <input
            type="text"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <label>Notes:</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
          ></textarea>
          <button type="submit" className="button">Submit</button>
        </form>
      </section>

      {/* Quotes Section */}
      <section className="section">
        <h3 className="section-heading">Your Quotes</h3>
        <ul className="quote-list">
          {quotes.length > 0 ? (
            quotes.map((quote) => (
              <li key={quote.requestid} className="quote-item">
                <strong>Request ID:</strong> {quote.requestid}
                <strong>Address:</strong> {quote.address}
                <strong>Driveway Size:</strong> {quote.drivewaysize} sq ft
                <strong>Price:</strong> ${quote.price}
                <strong>Status:</strong> {quote.status}
                <strong>Note:</strong> {quote.note || 'None'}
                {quote.status === 'negotiating' && (
                  <button
                    onClick={() => handleStatusUpdate(quote.requestid, 'agreed')}
                    className="button"
                  >
                    Set to Agreed
                  </button>
                )}
              </li>
            ))
          ) : (
            <li>No quotes available.</li>
          )}
        </ul>
      </section>

      {/* Bills Section */}
      <section className="section">
        <h3 className="section-heading">Your Bills</h3>
        <ul className="bill-list">
          {bills.length > 0 ? (
            bills.map((bill) => (
              <li key={bill.billid} className="bill-item">
                <strong>Bill ID:</strong> {bill.billid}
                <strong>Order ID:</strong> {bill.orderid}
                <strong>Amount:</strong> ${bill.amount}
                <strong>Status:</strong> {bill.status}
                <strong>Note:</strong> {bill.note || 'None'}
                {bill.status === 'pending' && (
                  <button
                    onClick={() => handlePayBill(bill.billid)}
                    className="button"
                  >
                    Pay
                  </button>
                )}
              </li>
            ))
          ) : (
            <li>No bills available.</li>
          )}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
