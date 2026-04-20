import { useRef, useState } from 'react';

function HomeScreen({ content, onEnterExperience }) {
  const videoRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const toggleSound = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextSoundState = !soundEnabled;
    video.muted = !nextSoundState;
    video.volume = nextSoundState ? 1 : 0;
    setSoundEnabled(nextSoundState);

    if (nextSoundState) {
      video.play().catch(() => {
        setSoundEnabled(false);
        video.muted = true;
      });
    }
  };

  return (
    <section className="view home-view">
      <div className="home-layout">
        <h1 className="home-title">{content.title}</h1>
        <div className="home-media">
          <div className={`hero-video-shell ${soundEnabled ? 'audio-reactive' : ''}`}>
            <video ref={videoRef} className="hero-video" autoPlay muted loop playsInline controls>
              <source src="/video/soon.mp4" type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>

          <p className="home-intro">{content.intro}</p>

          <div className="home-actions">
            <button className="immersion-btn" type="button" onClick={toggleSound}>
              {soundEnabled ? 'Couper le son' : content.audioButtonLabel}
            </button>
            <button className="immersion-btn" type="button" onClick={onEnterExperience}>
              {content.enterButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeScreen;
