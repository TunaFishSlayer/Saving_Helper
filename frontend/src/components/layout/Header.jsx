import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const Header = ({ onMenuClick }) => {
  const { user, isGuest } = useAuth();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;
      
      // Always show near the top
      if (currentScrollY < 30) {
        setVisible(true);
      } else if (Math.abs(diff) > 5) {
        // Only toggle visibility if scroll change is greater than 5px
        if (diff > 0) {
          setVisible(false); // scrolling down
        } else {
          setVisible(true); // scrolling up
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${visible ? '' : 'hidden'}`}>
      <button className="menu-button" onClick={onMenuClick}>
        <Menu size={24} />
      </button>

      <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 className="header-title">{t('welcome')}, {user?.name || 'User'}!</h2>
        
        {/* Connection status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: isGuest ? '#f8fafc' : '#f0fdf4',
          color: isGuest ? '#64748b' : '#15803d',
          border: `1px solid ${isGuest ? '#e2e8f0' : '#dcfce7'}`
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isGuest ? '#94a3b8' : '#22c55e',
            display: 'inline-block'
          }}></span>
          {isGuest ? 'Offline Mode' : 'Cloud Sync'}
        </div>
      </div>
    </header>
  );
};

export default Header;