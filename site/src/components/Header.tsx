import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import '../styles/header.css'

const Header: React.FC = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname.startsWith(path)

  const navItems = [
    { label: 'Discover', path: '/discover' },
    { label: 'Episodes', path: '/fan/episodes' },
    { label: 'Styling', path: '/fan/styling' },
    { label: "Lala's Closet", path: '/fan/closet' },
    { label: 'Blog', path: '/fan/blog' },
    { label: 'Tea Magazine', path: '/fan/magazine' },
  ]

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <img src={logo} alt="Styling Adventures" className="logo-image" />
          <div className="logo-text">
            <h1>Styling Adventures</h1>
            <p>Where Style Becomes an Adventure</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="header-actions">
          <button className="btn-login">Login</button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button className="btn-login btn-login-mobile">Login</button>
        </div>
      )}
    </header>
  )
}

export default Header
