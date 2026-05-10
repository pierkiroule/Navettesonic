export default function Home({ onEnter }) {
  return (
    <main className="home-screen">
      <section className="home-card old-home-card">
        <p className="kicker">Soon•°</p>

        <div className="home-video-orb" aria-label="Vidéo Soon">
          <video
            className="home-orb-video"
            src="/video/soon.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
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
