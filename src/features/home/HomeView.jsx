function HomeView({ onEnterExperience }) {
  return (
    <section className="view home-view">
      <div className="home-layout">
        <h1 className="home-title">Soon•°</h1>
        <div className="home-media">
          <img className="home-brand" src="/logo.svg" alt="Logo animé Soon•°" />
          <p className="home-poem">L'Odyssée sonore d'un petit poisson plume...</p>
          <div className="home-actions">
            <button className="immersion-btn" type="button">
              Activer le son
            </button>
            <button className="immersion-btn" type="button" onClick={onEnterExperience}>
              Immersion Soon•°
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeView;
