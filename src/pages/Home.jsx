export default function Home({ onEnter }) {
  return (
    <main className="home-screen">
      <section className="home-card old-home-card">
        <p className="kicker">Soon•°</p>

        <div className="home-video-orb placeholder-orb" aria-label="Placeholder poisson-plume">
          <div className="placeholder-water">
            <span className="placeholder-bubble b1" />
            <span className="placeholder-bubble b2" />
            <span className="placeholder-bubble b3" />

            <div className="placeholder-fish">
              <span className="fish-body" />
              <span className="fish-tail" />
              <span className="fish-wing left" />
              <span className="fish-wing right" />
            </div>
          </div>
        </div>

        <h1>L’odyssée sonore du poisson-plume</h1>

        <p className="home-lead">
          Compose un paysage d’écoute. Récolte des lucioles de résonance.
          Laisse naître des triangles haïkuatiques.
        </p>

        <button className="primary-btn home-enter-btn" type="button" onClick={onEnter}>
          Entrer dans Soon
        </button>

        <p className="home-note">
          Arène locale · Sons Soon · Traversée sensible
        </p>
      </section>
    </main>
  );
}
