declare module 'gifshot' {
  export interface GIFOptions {
    images?: string[];
    gifWidth?: number;
    gifHeight?: number;
    interval?: number; // seconds between frames
    numFrames?: number;
    frameDuration?: number; // 10 = 1s, so 1 = 100ms
    sampleInterval?: number;
    numWorkers?: number;
    keepCameraOn?: boolean;
    cameraZoom?: number;
    text?: string;
    fontWeight?: string;
    fontSize?: string;
    minFontSize?: string;
    resizeFont?: boolean;
    fontFamily?: string;
    fontColor?: string;
    textAlign?: string;
    textBaseline?: string;
    textXCoordinate?: number;
    textYCoordinate?: number;
    progressCallback?: (captureProgress: number) => void;
    completeCallback?: (obj: { image: string; error: boolean; errorCode: string; errorMsg: string }) => void;
  }

  export function createGIF(
    options: GIFOptions,
    callback: (obj: { image: string; error: boolean; errorCode: string; errorMsg: string }) => void
  ): void;
}
