export function HomePage() {
  return (
    <main className="home-shell home-layout-clean">
      <section className="home-card-clean">
        <h1 className="home-title-clean">Soon•°</h1>
        <div className="home-video-ring" aria-label="Accueil vidéo Soon">
          <div className="home-video-inner">
            <video autoPlay muted loop playsInline controls>
              <source src="/video/soon.mp4" type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        </div>
        <p className="home-poem">Échohypnose d&apos;un poisson-plume !</p>
        <div className="home-actions">
          <a className="immersion-btn" href="/?arena=host">Composer mon arène</a>
        </div>
      </section>
    </main>
  );
}
