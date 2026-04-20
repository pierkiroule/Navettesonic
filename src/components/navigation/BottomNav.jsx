import { getNavigationItems } from './model/navigationModel';

function BottomNav({ activeView, onChange }) {
  const items = getNavigationItems();

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
