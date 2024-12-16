import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const token = localStorage.getItem('token'); // Check if the user is logged in

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1 className="main-heading">Welcome to Smith Driveway Solutions</h1>
        <p className="sub-heading">Professional Driveway Sealing and Maintenance</p>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <ul className="nav-list">
          {!token ? (
            <>
              <li><Link to="/login" className="nav-link">Login</Link></li>
              <li><Link to="/register" className="nav-link">Register</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
              <li>
                <button
                  className="nav-button"
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* About Section */}
      <section className="section about">
        <h2 className="section-heading">Why Choose Us?</h2>
        <p className="section-text">
          At Smith Driveway Solutions, we specialize in driveway sealing and maintenance. With years of experience and hundreds of satisfied clients, we ensure that your driveway looks great and lasts longer.
        </p>
        <ul className="feature-list">
          <li>✔ Professional Sealing Services</li>
          <li>✔ Quick and Reliable Work</li>
          <li>✔ Competitive Pricing</li>
          <li>✔ Quality Materials Used</li>
        </ul>
      </section>

      {/* Contact Section */}
      <section className="section contact">
        <h2 className="section-heading">Get in Touch</h2>
        <p className="section-text">Have questions or need a quote? Contact us today!</p>
        <p className="contact-details">
          📞 (123) 456-7890<br />
          ✉️ contact@smithdrivewaysolutions.com<br />
          📍 123 Driveway Lane, Paving City, PC 12345
        </p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; Project 2 by Reyna Macabeb & Kunjal Parajuli</p>
      </footer>
    </div>
  );
};

export default HomePage;
