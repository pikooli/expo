import { useEvent } from 'expo';
import { useEffect, useState, useMemo } from 'react';

import {
  AudioMode,
  AudioSource,
  AudioStatus,
  RecorderState,
  RecordingOptions,
  RecordingStatus,
} from './Audio.types';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import * as AudioModule from './AudioModule.web';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';

export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  updateInterval: number = 500
): AudioModule.AudioPlayerWeb {
  const parsedSource = resolveSource(source);
  const player = useMemo(
    () => new AudioModule.AudioPlayerWeb(parsedSource, updateInterval),
    [JSON.stringify(parsedSource)]
  );

  useEffect(() => {
    return () => player.remove();
  }, []);

  return player;
}

export function useAudioPlayerStatus(player: AudioModule.AudioPlayerWeb): AudioStatus {
  const currentStatus = useMemo(() => player.currentStatus, [player.id]);
  return useEvent(player, 'onPlaybackStatusUpdate', currentStatus);
}

export function useAudioSampleListener(
  player: AudioModule.AudioPlayerWeb,
  listener: (data: { channels: { frames: number[] }[]; timestamp: number }) => void
) {
  player.setAudioSamplingEnabled(true);
  useEffect(() => {
    const subscription = player.addListener('onAudioSampleUpdate', listener);
    return () => {
      player.setAudioSamplingEnabled(false);
      subscription.remove();
    };
  }, [player.id]);
}

export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (status: RecordingStatus) => void,
  updateInterval: number = 500
): [AudioModule.AudioRecorderWeb, RecorderState] {
  const platformOptions = createRecordingOptions(options);
  const recorder = useMemo(() => {
    return new AudioModule.AudioRecorderWeb(platformOptions);
  }, [JSON.stringify(platformOptions)]);

  const [state, setState] = useState<RecorderState>(recorder.getStatus());

  useEffect(() => {
    const subscription = recorder.addListener('onRecordingStatusUpdate', (status) => {
      statusListener?.(status);
    });
    return () => subscription.remove();
  }, [recorder.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = recorder.getStatus();
      setState(status);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [recorder.id]);

  return [recorder, state];
}

export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

export async function setAudioModeAsync(mode: AudioMode): Promise<void> {
  return await AudioModule.setAudioModeAsync(mode);
}

export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
