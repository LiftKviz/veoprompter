import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// You can customize more settings here if needed
Config.setConcurrency(1);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');