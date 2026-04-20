function ProfileView() {
  return (
    <section className="view profile-view">
      <div className="profile-wrap">
        <h1>Profil Soono•°</h1>
        <p className="profile-sub">Connecte Supabase Auth, teste le store audio et active gratuitement tes premiers samples.</p>
        <div className="profile-grid">
          <article className="card">
            <h3>Connexion Supabase (Auth + Session)</h3>
            <p>Compte local via Supabase Auth (email + mot de passe).</p>
          </article>
          <article className="card">
            <h3>Supabase Storage · Soonbucket</h3>
            <p>Connexion rapide au bucket Soonbucket pour tester un upload depuis l'interface.</p>
          </article>
          <article className="card">
            <h3>Store sonore (paiement simulé)</h3>
            <p>Le paiement est simulé: activation gratuite pour le moment, puis ajout à la collection.</p>
          </article>
          <article className="card">
            <h3>Ma collection activée</h3>
            <p>Samples débloqués pour ce compte/session.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default ProfileView;
