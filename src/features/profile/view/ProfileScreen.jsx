function ProfileScreen({ content }) {
  return (
    <section className="view profile-view">
      <div className="profile-wrap">
        <h1>{content.title}</h1>
        <p className="profile-sub">{content.subtitle}</p>
        <div className="profile-grid">
          {content.cards.map((card) => (
            <article key={card.title} className="card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProfileScreen;
