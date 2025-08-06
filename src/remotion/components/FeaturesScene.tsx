import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from 'remotion';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '📋',
    title: 'Smart Prompts',
    description: 'Access curated prompts for any video style'
  },
  {
    icon: '✨',
    title: 'AI Modification',
    description: 'Customize prompts with GPT-4 integration'
  },
  {
    icon: '⭐',
    title: 'Save Favorites',
    description: 'Build your personal prompt library'
  }
];

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 80,
    }}>
      <h2 style={{
        fontSize: 56,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 60,
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}>
        Powerful Features
      </h2>

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '70%',
      }}>
        {features.map((feature, index) => {
          const delay = index * 15;
          const scale = interpolate(
            frame,
            [delay, delay + 20],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          const slideIn = interpolate(
            frame,
            [delay, delay + 20],
            [100, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={index}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 20,
                padding: 40,
                width: 300,
                transform: `scale(${scale}) translateY(${slideIn}px)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{
                fontSize: 72,
                textAlign: 'center',
                marginBottom: 20,
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: 15,
                fontFamily: 'Arial, sans-serif',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif',
                lineHeight: 1.5,
              }}>
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};