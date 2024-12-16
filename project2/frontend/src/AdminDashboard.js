import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './styles.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch Quotes, Orders, and Bills on Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        const [quotesRes, ordersRes, billsRes] = await Promise.all([
          axios.get('http://localhost:5000/admin/quotes', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/admin/orders', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/admin/bills', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setQuotes(quotesRes.data);
        setOrders(ordersRes.data);
        setBills(billsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data.');
      }
    };

    fetchData();
  }, []);

  // Function to Update Quote Status
  const handleUpdateQuote = async (requestid, newStatus) => {
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/admin/update-quote-status',
        { requestid, newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setQuotes((prev) =>
        prev.map((quote) =>
          quote.requestid === requestid ? { ...quote, status: newStatus } : quote
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quote status.');
    }
  };

  // Function to Complete Order
  const handleCompleteOrder = async (orderid) => {
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/admin/complete-order',
        { orderid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setOrders((prev) =>
        prev.map((order) =>
          order.orderid === orderid
            ? { ...order, status: 'completed', enddate: new Date().toISOString().split('T')[0] }
            : order
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete the order.');
    }
  };

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="container">
      <h2 className="heading-main">Admin Dashboard</h2>

      {/* Navigation */}
      <nav>
        <ul className="nav-list">
          <li><Link to="/" className="nav-link">Home</Link></li>
          <li>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </li>
        </ul>
      </nav>

      {/* Error and Message */}
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      {/* Quotes Section */}
      <section className="section">
        <h3 className="section-heading">All Quotes</h3>
        <ul className="quote-list">
          {quotes.length > 0 ? (
            quotes.map((quote) => (
              <li key={quote.requestid} className="quote-item">
                <strong>Request ID:</strong> {quote.requestid} <br />
                <strong>Client ID:</strong> {quote.clientid} <br />
                <strong>Address:</strong> {quote.address} <br />
                <strong>Status:</strong> {quote.status} <br />
                {quote.status === 'pending' && (
                  <div>
                    <button
                      onClick={() => handleUpdateQuote(quote.requestid, 'negotiating')}
                      className="button"
                    >
                      Set to Negotiating
                    </button>
                    <button
                      onClick={() => handleUpdateQuote(quote.requestid, 'denied')}
                      className="button button-deny"
                    >
                      Deny
                    </button>
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className="quote-item">No quotes available.</li>
          )}
        </ul>
      </section>

      {/* Orders Section */}
      <section className="section">
        <h3 className="section-heading">All Orders</h3>
        <ul className="order-list">
          {orders.length > 0 ? (
            orders.map((order) => (
              <li key={order.orderid} className="order-item">
                <strong>Order ID:</strong> {order.orderid} <br />
                <strong>Request ID:</strong> {order.requestid} <br />
                <strong>Start Date:</strong> {order.startdate} <br />
                <strong>End Date:</strong> {order.enddate || 'N/A'} <br />
                <strong>Agreed Price:</strong> ${order.agreedprice} <br />
                <strong>Status:</strong> {order.status} <br />
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCompleteOrder(order.orderid)}
                    className="button"
                  >
                    Set to Completed
                  </button>
                )}
              </li>
            ))
          ) : (
            <li className="order-item">No orders available.</li>
          )}
        </ul>
      </section>

      {/* Bills Section */}
      <section className="section">
        <h3 className="section-heading">All Bills</h3>
        <ul className="bill-list">
          {bills.length > 0 ? (
            bills.map((bill) => (
              <li key={bill.billid} className="bill-item">
                <strong>Bill ID:</strong> {bill.billid} <br />
                <strong>Order ID:</strong> {bill.orderid} <br />
                <strong>Amount:</strong> ${bill.amount} <br />
                <strong>Status:</strong> {bill.status} <br />
                <strong>Note:</strong> {bill.note || 'N/A'}
              </li>
            ))
          ) : (
            <li className="bill-item">No bills available.</li>
          )}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;
