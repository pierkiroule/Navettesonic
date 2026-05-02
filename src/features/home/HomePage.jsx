export function HomePage() {
  return (
    <section id="homeView" className="view home-shell">
      <div className="home-layout">
        <h1 className="home-title">Soon•°</h1>
        <div className="home-media">
          <div id="heroVideoShell" className="hero-video-shell">
            <video id="heroVideo" className="hero-video" autoPlay muted loop playsInline controls>
              <source src="/video/soon.mp4" type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
          <p className="home-poem">Échohypnose d&apos;un poisson-plume !</p>
          <div className="home-actions">
            <a id="enterExperienceBtn" className="immersion-btn" href="/?arena=host">
              Entrer dans Soon arène
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
