import React from 'react';
import { Composition } from 'remotion';
import { VeoPromoVideo } from './VeoPromoVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VeoPromo"
        component={VeoPromoVideo}
        durationInFrames={240} // 8 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};