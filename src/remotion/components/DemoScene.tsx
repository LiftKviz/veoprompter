import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const extensionScale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    config: {
      damping: 100,
      stiffness: 200,
    },
  });

  const promptCardOpacity = interpolate(
    frame,
    [10, 20],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const buttonHighlight = interpolate(
    frame,
    [30, 35, 40, 45],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Mock Extension UI */}
      <div style={{
        width: 800,
        height: 600,
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        transform: `scale(${extensionScale})`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{
            color: 'white',
            margin: 0,
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
          }}>
            🎬 Veo 3 Prompt Assistant
          </h3>
          <div style={{
            display: 'flex',
            gap: 10,
          }}>
            <button style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Arial, sans-serif',
            }}>
              ⭐ Saved
            </button>
          </div>
        </div>

        {/* Prompt Card */}
        <div style={{
          margin: 20,
          padding: 20,
          background: '#f8f9fa',
          borderRadius: 12,
          opacity: promptCardOpacity,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            fontSize: 20,
            fontFamily: 'Arial, sans-serif',
            color: '#333',
          }}>
            IKEA Empty Room Assembly
          </h4>
          <p style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: '#666',
            fontFamily: 'Arial, sans-serif',
            marginBottom: 20,
          }}>
            8-second cinematic furniture assembly magic. Sealed IKEA cardboard box 
            positioned center frame in empty room. Box trembles and shakes, then 
            bursts open with furniture pieces floating and assembling in fast motion...
          </p>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: 10,
          }}>
            <button style={{
              background: '#4CAF50',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Arial, sans-serif',
              boxShadow: buttonHighlight > 0 ? `0 0 20px rgba(76,175,80,${buttonHighlight})` : 'none',
            }}>
              📋 Copy
            </button>
            <button style={{
              background: '#2196F3',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Arial, sans-serif',
            }}>
              ✏️ Modify
            </button>
            <button style={{
              background: '#FF9800',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Arial, sans-serif',
            }}>
              ▶️ Preview
            </button>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};