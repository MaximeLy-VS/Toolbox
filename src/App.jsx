import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Upload, Image as ImageIcon, Copy, Check, AlertCircle, Loader2, Info } from 'lucide-react';
import backgroundImage from './assets/Background.jpg';
import './App.css';

function App() {
  return (
    <Router>
      <nav className="p-4 bg-gray-100 flex gap-4">
        <Link to="/tools/AN_Image">Assistant AN – Images</Link>
        <Link to="/tools/AN_tableau">Assistant AN – Tableaux</Link>
        <Link to="/tools/Mockup_app">Mock-up Images</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/AN_Image" element={<ANimageApp />} />
        <Route path="/tools/AN_tableau" element={<ANtableauApp />} />
        <Route path="/tools/Mockup_app" element={<MockupApp />} />
      </Routes>
    </Router>
  );
}