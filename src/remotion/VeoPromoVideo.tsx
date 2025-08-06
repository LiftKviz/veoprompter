import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from 'remotion';
import { TitleScene } from './components/TitleScene';
import { FeaturesScene } from './components/FeaturesScene';
import { DemoScene } from './components/DemoScene';
import { CTAScene } from './components/CTAScene';

export const VeoPromoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f0f' }}>
      {/* Title Scene - 0-60 frames (2 seconds) */}
      <Sequence from={0} durationInFrames={60}>
        <TitleScene />
      </Sequence>

      {/* Features Scene - 60-150 frames (3 seconds) */}
      <Sequence from={60} durationInFrames={90}>
        <FeaturesScene />
      </Sequence>

      {/* Demo Scene - 150-210 frames (2 seconds) */}
      <Sequence from={150} durationInFrames={60}>
        <DemoScene />
      </Sequence>

      {/* CTA Scene - 210-240 frames (1 second) */}
      <Sequence from={210} durationInFrames={30}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};