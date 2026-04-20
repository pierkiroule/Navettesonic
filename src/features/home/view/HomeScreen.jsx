function HomeScreen({ content, onEnterExperience, onToggleSound }) {
  return (
    <section className="view home-view">
      <div className="home-layout">
        <h1 className="home-title">{content.title}</h1>
        <p className="home-subtitle">{content.subtitle}</p>
        <div className="home-media">
          <div className="home-bubble-video-wrap" aria-hidden="true">
            <video className="home-bubble-video" src={content.heroVideoUrl} autoPlay loop muted playsInline />
          </div>
          <p className="home-intro">{content.intro}</p>
          <div className="home-actions">
            <button className="immersion-btn" type="button" onClick={onToggleSound}>
              {content.audioButtonLabel}
            </button>
            <button className="immersion-btn" type="button" onClick={onEnterExperience}>
              {content.enterButtonLabel}
            </button>
          </div>
          <p className="home-sound-status">{content.soundStatus}</p>
        </div>
      </div>
    </section>
  );
}

export default HomeScreen;
