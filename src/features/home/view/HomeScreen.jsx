function HomeScreen({ content, onEnterExperience }) {
  return (
    <section className="view home-view">
      <div className="home-layout">
        <h1 className="home-title">{content.title}</h1>
        <div className="home-media">
          <p className="home-intro">{content.intro}</p>
          <div className="home-actions">
            <button className="immersion-btn" type="button">
              {content.audioButtonLabel}
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
