import { useRef, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import useAudioStore from "../../lib/audio";
import { useControls } from "../../lib/store/controls";

export function AudioWave() {
  const ref = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>(null);

  const { audioAnalyser, audioData } = useAudioStore(
    useShallow((state) => ({
      audioAnalyser: state.audioAnalyser,
      audioData: state.audioData,
    }))
  );
  const { audioReactivity, audioSensitivity } = useControls(
    useShallow((state) => ({
      audioReactivity: state.reactivity,
      audioSensitivity: state.sensitivity,
    }))
  );

  useEffect(() => {
    function updateAudioWave() {
      const wave = ref.current;
      if (!wave) return;
      if (!audioAnalyser) return;
      audioAnalyser.getByteTimeDomainData(audioData);
      let sum = 0;
      for (let i = 0; i < audioData.length; i++) {
        sum += Math.abs(audioData[i] - 128);
      }
      const average = sum / audioData.length;
      const normalizedAverage = average / audioData.length;
      const scale =
        1 + normalizedAverage * audioReactivity * (audioSensitivity / 5);
      wave.style.transform = `translate(-50%, -50%) scale(${scale})`;
      wave.style.borderColor = `rgba(255, 78, 66, ${
        0.1 + normalizedAverage * 0.3
      })`;
      animationFrameId.current = requestAnimationFrame(updateAudioWave);
    }

    animationFrameId.current = requestAnimationFrame(updateAudioWave);

    return () => {
      if (!animationFrameId.current) return;
      cancelAnimationFrame(animationFrameId.current);
    };
  });

  return <div className="audio-wave" id="audio-wave" ref={ref} />;
}
