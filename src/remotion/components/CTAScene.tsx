import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 100,
      stiffness: 200,
    },
  });

  const shimmer = interpolate(
    frame,
    [0, 30],
    [-100, 100],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Logo */}
      <div style={{
        fontSize: 100,
        marginBottom: 30,
        transform: `scale(${scale})`,
      }}>
        🎬
      </div>

      {/* CTA Text */}
      <h2 style={{
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
        transform: `scale(${scale})`,
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}>
        Get Started Today!
      </h2>

      {/* Chrome Web Store Button */}
      <div style={{
        transform: `scale(${scale})`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <button style={{
          background: '#4CAF50',
          border: 'none',
          color: 'white',
          padding: '20px 40px',
          borderRadius: 50,
          cursor: 'pointer',
          fontSize: 24,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          boxShadow: '0 8px 20px rgba(76,175,80,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          Add to Chrome
        </button>
        
        {/* Shimmer effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: `${shimmer}%`,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Tagline */}
      <p style={{
        fontSize: 20,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 20,
        opacity: scale,
        fontFamily: 'Arial, sans-serif',
      }}>
        Free Chrome Extension
      </p>
    </AbsoluteFill>
  );
};