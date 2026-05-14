import { useEffect, useRef, useState } from "react";
import RadialMenuDemo from "../components/RadialMenuDemo.jsx";

export default function Home({ onEnter }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Lecture vidéo impossible :", error);
    }
  };

  const pauseVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
  };

  const stopVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
  };

  const handleEnter = () => {
    stopVideo();
    onEnter?.();
  };

  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, []);

  return (
    <main className="home-screen">
      <section className="home-card">
        <p className="kicker">Soon•°</p>

        <div className={`home-video-orb ${isPlaying ? "is-playing" : ""}`}>
          <div className="orb-audio-halo" />

          <video
            ref={videoRef}
            className="home-orb-video"
            src="/video/soon.mp4"
            loop
            playsInline
            onClick={pauseVideo}
          />

          {!isPlaying && (
            <button
              className="orb-play-btn"
              type="button"
              onClick={playVideo}
              aria-label="Lancer la vidéo Soon"
            >
              ▶
            </button>
          )}
        </div>

        <h1>L’odyssée sonore du poisson-plume</h1>

        <p className="home-lead">
          Compose un paysage d’écoute. Récolte des lucioles de résonance.
          Laisse naître des triangles haïkuatiques.
        </p>

        <button className="primary-btn home-enter-btn" type="button" onClick={handleEnter}>
          Entrer dans Soon
        </button>

        <p className="home-note">
          Arène locale · Sons Soon · Traversée sensible
        </p>

        <RadialMenuDemo />
      </section>
    </main>
  );
}