import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  
import HomePage from './HomePage';  
import Login from './Login';  
import Register from './Register';  
import Dashboard from './Dashboard';  
import AdminDashboard from './AdminDashboard';  
import Profile from './Profile';  
import PrivateRoute from './PrivateRoute'; 
import ViewQuotes from './ViewQuotes';

function App() {
  return (
    <Router>  
      <Routes>  
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />  
            </PrivateRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />  
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />  
            </PrivateRoute>
          }
        />
        <Route
          path="/view-quotes"
          element={
            <PrivateRoute>
              <ViewQuotes />  {/* Route for viewing user-specific quotes */}
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
