import React from "react";
import { Howl, Howler } from "howler";

// Prioritize webm
const songs = [
  ["/music/Neon.Deflector_Artifact.webm", "/music/Neon.Deflector_Artifact.mp3"],
  [
    "/music/Neon.Deflector_StarDreamer.webm",
    "/music/Neon.Deflector_StarDreamer.mp3",
  ],
];

export function useMusic(): [boolean, () => {}] {
  const activeSong = React.useRef<Howl | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const isFirstSong = React.useRef(true);

  const playSong = React.useCallback((number: number) => {
    const song = new Howl({
      volume: 1,
      autoplay: false,
      src: songs[number],
    });

    if (song.state() === "loaded") {
      song.play();
    } else {
      // Play after initial song load
      song.on("load", () => {
        song.play();
      });
    }

    song.on("play", () => {
      setIsPlaying(true);
    });

    song.on("pause", () => {
      setIsPlaying(false);
    });

    // Keep playing the next song when the current song ends
    song.on("end", () => {
      playSong((number + 1) % songs.length);
    });

    activeSong.current = song;
    return song;
  }, []);

  const toggle = React.useCallback(() => {
    if (isFirstSong.current) {
      isFirstSong.current = false;
      const firstSong = playSong(0);
      firstSong.volume(0);
      // Fade in the first song
      firstSong.fade(0, 1, 15 * 1000);
      return true;
    }

    if (!activeSong.current) {
      // setIsPlaying(false);
      return false;
    } else if (activeSong.current.playing()) {
      activeSong.current?.pause();
      return false;
    } else {
      activeSong.current.play();
      return true;
    }
  }, [playSong]);

  React.useEffect(() => {
    return () => {
      Howler.unload();
    };
  }, [playSong]);

  return [isPlaying, toggle];
}
