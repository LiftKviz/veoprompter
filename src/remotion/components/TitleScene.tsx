import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const subtitleOpacity = interpolate(
    frame,
    [20, 40],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const logoRotation = interpolate(
    frame,
    [0, 60],
    [0, 360],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    }}>
      {/* Logo Animation */}
      <div style={{
        fontSize: 120,
        marginBottom: 20,
        transform: `rotate(${logoRotation}deg) scale(${titleScale})`,
      }}>
        🎬
      </div>

      {/* Main Title */}
      <h1 style={{
        fontSize: 72,
        fontWeight: 'bold',
        color: 'white',
        margin: 0,
        transform: `scale(${titleScale})`,
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}>
        Veo 3 Prompt Assistant
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: 28,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 20,
        opacity: subtitleOpacity,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
      }}>
        Supercharge Your Video Creation with AI
      </p>
    </AbsoluteFill>
  );
};