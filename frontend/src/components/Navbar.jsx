import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          🎫 Help Desk
        </Link>

        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/dashboard" className="navbar-link">
              Dashboard
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/tickets" className="navbar-link">
              Tickets
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/new-ticket" className="navbar-link">
              Novo Ticket
            </Link>
          </li>
          {user?.role === 'admin' && (
            <li className="navbar-item">
              <Link to="/admin" className="navbar-link">
                Admin
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar-user">
          <span className="user-name">👤 {user?.name}</span>
          <span className="user-role">({user?.role})</span>
          <button onClick={handleLogout} className="logout-btn">
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
