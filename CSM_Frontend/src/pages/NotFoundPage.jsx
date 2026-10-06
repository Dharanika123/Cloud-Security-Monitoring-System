import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 65px)',
      width: '100%',
      backgroundColor: 'transparent',
      color: '#fff',
      padding: '24px',
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Compass size={100} color="#3b82f6" style={{ opacity: 0.2, position: 'absolute', top: -10, left: -20, transform: 'rotate(-20deg)' }} />
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          position: 'relative',
          zIndex: 1
        }}>
          404
        </h1>
      </div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '16px', marginTop: 0 }}>
        Lost in the Cyber Void
      </h2>

      <p style={{ color: '#94a3b8', maxWidth: '450px', marginBottom: '40px', lineHeight: 1.6, fontSize: '1rem' }}>
        We couldn't find the page you were looking for. It might have been secured, deleted, or perhaps it never existed in this sector.
      </p>

      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 28px',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#fff',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Home size={18} />
        Return to Safety
      </button>

      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(10,12,16,0) 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
    </div>
  );
};
