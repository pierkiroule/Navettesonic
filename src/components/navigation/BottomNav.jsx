import { APP_VIEWS } from '../../core/utils/views';

function BottomNav({ activeView, onChange }) {
  const items = [
    { id: APP_VIEWS.HOME, label: 'Accueil' },
    { id: APP_VIEWS.EXPERIENCE, label: 'Soon•°' },
    { id: APP_VIEWS.PROFILE, label: 'Profil' },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      <div className="nav-shell">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-btn ${activeView === item.id ? 'active' : ''}`.trim()}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
