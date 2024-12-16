// Required dependencies
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Allow requests from different origins
const upload = multer({ dest: 'pictures/' }); 

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'project2',
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});

// JWT Secret
const JWT_SECRET = 'your_jwt_secret';

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});

// Register
app.post('/register', async (req, res) => {
  const { firstname, lastname, address, creditcard, phonenumber, email, password, role } = req.body;
  if (!firstname || !lastname || !address || !creditcard || !phonenumber || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO Clients (firstname, lastname, address, creditcard, phonenumber, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [firstname, lastname, address, creditcard, phonenumber, email, hashedPassword, role || 'client'];
    db.query(query, values, (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email is already registered.' });
        }
        return res.status(500).json({ message: 'Failed to register user.' });
      }
      res.status(201).json({ message: 'User registered successfully.' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM Clients WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    const client = results[0];
    const passwordMatch = await bcrypt.compare(password, client.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ clientid: client.clientid, role: client.role }, JWT_SECRET, { expiresIn: '3h' });
    res.json({ token });
  });
});


const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing or invalid.' });
    }

    jwt.verify(token, 'your-secret-key', (err, user) => { // Replace 'your-secret-key' with your actual secret
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }

        req.user = user; // Attach user information to the request
        next(); // Proceed to the next middleware or route handler
    });
};

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
      return res.status(401).json({ message: 'Access token is missing or invalid.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => { // Ensure `JWT_SECRET` matches the secret key used during token creation
      if (err) {
          return res.status(403).json({ message: 'Invalid token.' });
      }

      req.client = user; // Attach decoded token data to request object
      next(); // Proceed to the next middleware or route handler
  });
};





app.post('/submit-quote', authenticateToken, upload.single('picture'), (req, res) => {
  console.log('Received body:', req.body);
  console.log('Received file:', req.file);

  const { address, drivewaysize, price, note } = req.body;
  const clientid = req.client.clientid; // Extract client ID from JWT token

  if (!address || !drivewaysize || !price) {
    console.warn('Missing fields:', { address, drivewaysize, price });
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const query = `
    INSERT INTO Requests (clientid, address, drivewaysize, price, note, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `;
  const values = [clientid, address, drivewaysize, price, note];

  db.query(query, values, (err) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to submit request.' });
    }
    res.status(201).json({ message: 'Request submitted successfully.' });
  });
});

app.get('/requests', authenticateToken, (req, res) => {
  const clientid = req.client.clientid;

  const query = `
    SELECT * FROM Requests WHERE clientid = ?
  `;
  db.query(query, [clientid], (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to retrieve requests.' });
    }
    res.status(200).json(results);
  });
});

app.get('/quotes', authenticateToken, (req, res) => {
  const clientid = req.client.clientid; // Extract client ID from JWT token

  const query = `
    SELECT requestid, clientid, address, drivewaysize, price, note, status
    FROM Requests
    WHERE clientid = ?
  `;

  db.query(query, [clientid], (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to fetch quotes.' });
    }
    res.status(200).json(results);
  });
});



app.get('/admin/quotes', authenticateToken, (req, res) => {
  const role = req.client.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const query = `
    SELECT requestid, clientid, address, drivewaysize, price, note, status
    FROM Requests
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to fetch quotes.' });
    }
    res.status(200).json(results);
  });
});

app.post('/admin/update-quote-status', authenticateToken, (req, res) => {
  const role = req.client.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const { requestid, newStatus } = req.body;

  if (!requestid || !newStatus) {
    return res.status(400).json({ message: 'Request ID and new status are required.' });
  }

  // Allowed statuses: 'negotiating' and 'denied'
  const allowedStatuses = ['negotiating', 'denied'];
  if (!allowedStatuses.includes(newStatus)) {
    return res.status(400).json({ message: 'Invalid status provided.' });
  }

  const query = `
    UPDATE Requests
    SET status = ?
    WHERE requestid = ?
  `;

  db.query(query, [newStatus, requestid], (err, result) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to update quote status.' });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'No quote found with the given ID.' });
    }

    res.status(200).json({ message: `Quote status updated to ${newStatus}.` });
  });
});




app.post('/update-quote-status', authenticateToken, (req, res) => {
  const clientid = req.client.clientid; // Extract the client ID from JWT
  const { requestid, newStatus } = req.body;

  if (!requestid || !newStatus) {
    return res.status(400).json({ message: 'Request ID and new status are required.' });
  }

  // Ensure only valid status transitions are allowed
  const allowedStatuses = ['negotiating', 'agreed'];
  if (!allowedStatuses.includes(newStatus)) {
    return res.status(400).json({ message: 'Invalid status transition.' });
  }

  // Start a transaction to handle both updating the request and creating the order
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err.message);
      return res.status(500).json({ message: 'Failed to start transaction.' });
    }

    // Update the request status
    const updateRequestQuery = `
      UPDATE Requests
      SET status = ?
      WHERE requestid = ? AND clientid = ?
    `;
    db.query(updateRequestQuery, [newStatus, requestid, clientid], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Update error:', updateErr.message);
        return db.rollback(() => {
          res.status(500).json({ message: 'Failed to update quote status.' });
        });
      }

      if (updateResult.affectedRows === 0) {
        return db.rollback(() => {
          res.status(400).json({ message: 'No matching quote found or invalid status transition.' });
        });
      }

      // If the new status is 'agreed', insert a new order
      if (newStatus === 'agreed') {
        const getRequestDetailsQuery = `
          SELECT price
          FROM Requests
          WHERE requestid = ?
        `;
        db.query(getRequestDetailsQuery, [requestid], (getDetailsErr, getDetailsResult) => {
          if (getDetailsErr || getDetailsResult.length === 0) {
            console.error('Get details error:', getDetailsErr?.message || 'No matching request.');
            return db.rollback(() => {
              res.status(500).json({ message: 'Failed to retrieve request details.' });
            });
          }

          const agreedPrice = getDetailsResult[0].price;
          const insertOrderQuery = `
            INSERT INTO Orders (requestid, startdate, agreedprice, status)
            VALUES (?, CURDATE(), ?, 'pending')
          `;
          db.query(insertOrderQuery, [requestid, agreedPrice], (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Insert order error:', insertErr.message);
              return db.rollback(() => {
                res.status(500).json({ message: 'Failed to create order.' });
              });
            }
            db.commit((commitErr) => {
              if (commitErr) {
                console.error('Commit error:', commitErr.message);
                return db.rollback(() => {
                  res.status(500).json({ message: 'Failed to commit transaction.' });
                });
              }
              res.status(200).json({ message: 'Quote status updated and order created successfully.' });
            });
          });
        });
      } else {
        // Commit if no order is created
        db.commit((commitErr) => {
          if (commitErr) {
            console.error('Commit error:', commitErr.message);
            return db.rollback(() => {
              res.status(500).json({ message: 'Failed to commit transaction.' });
            });
          }

          res.status(200).json({ message: 'Quote status updated successfully.' });
        });
      }
    });
  });
});


app.get('/admin/orders', authenticateToken, (req, res) => {
  const role = req.client.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const query = `
    SELECT orderid, requestid, startdate, enddate, agreedprice, status
    FROM Orders
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to fetch orders.' });
    }
    res.status(200).json(results);
  });
});

app.post('/admin/complete-order', authenticateToken, (req, res) => {
  const role = req.client.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const { orderid } = req.body;

  if (!orderid) {
    return res.status(400).json({ message: 'Order ID is required.' });
  }

  // Start a transaction to ensure atomic updates
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err.message);
      return res.status(500).json({ message: 'Failed to start transaction.' });
    }

    // Update the order to 'completed' and set enddate
    const updateOrderQuery = `
      UPDATE Orders
      SET status = 'completed', enddate = CURDATE()
      WHERE orderid = ?
    `;
    db.query(updateOrderQuery, [orderid], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Order update error:', updateErr.message);
        return db.rollback(() => res.status(500).json({ message: 'Failed to update order.' }));
      }

      if (updateResult.affectedRows === 0) {
        return db.rollback(() => res.status(400).json({ message: 'No order found with the given ID.' }));
      }

      // Retrieve agreed price for the order
      const getOrderQuery = `
        SELECT agreedprice
        FROM Orders
        WHERE orderid = ?
      `;
      db.query(getOrderQuery, [orderid], (getErr, getResult) => {
        if (getErr || getResult.length === 0) {
          console.error('Retrieve order error:', getErr?.message || 'No matching order.');
          return db.rollback(() => res.status(500).json({ message: 'Failed to retrieve order details.' }));
        }

        const agreedPrice = getResult[0].agreedprice;

        // Insert a new bill
        const insertBillQuery = `
          INSERT INTO Bills (orderid, amount, status)
          VALUES (?, ?, 'pending')
        `;
        db.query(insertBillQuery, [orderid, agreedPrice], (billErr) => {
          if (billErr) {
            console.error('Insert bill error:', billErr.message);
            return db.rollback(() => res.status(500).json({ message: 'Failed to create bill.' }));
          }

          // Commit the transaction
          db.commit((commitErr) => {
            if (commitErr) {
              console.error('Commit error:', commitErr.message);
              return db.rollback(() => res.status(500).json({ message: 'Failed to commit transaction.' }));
            }

            res.status(200).json({ message: 'Order completed and bill created successfully.' });
          });
        });
      });
    });
  });
});


app.get('/admin/bills', authenticateToken, (req, res) => {
  const role = req.client.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const query = `
    SELECT billid, orderid, note, amount, status
    FROM Bills
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to fetch bills.' });
    }
    res.status(200).json(results);
  });
});

app.get('/bills', authenticateToken, (req, res) => {
  const clientid = req.client.clientid;

  const query = `
    SELECT b.billid, b.orderid, b.amount, b.status, b.note
    FROM Bills b
    JOIN Orders o ON b.orderid = o.orderid
    JOIN Requests r ON o.requestid = r.requestid
    WHERE r.clientid = ?
  `;

  db.query(query, [clientid], (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to fetch bills.' });
    }
    res.status(200).json(results);
  });
});


app.post('/pay-bill', authenticateToken, (req, res) => {
  const { billid } = req.body;

  if (!billid) {
    return res.status(400).json({ message: 'Bill ID is required.' });
  }

  const query = `
    UPDATE Bills
    SET status = 'agreed'
    WHERE billid = ?
  `;

  db.query(query, [billid], (err, result) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to update bill status.' });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'No bill found with the given ID.' });
    }

    res.status(200).json({ message: 'Bill marked as paid successfully.' });
  });
});





