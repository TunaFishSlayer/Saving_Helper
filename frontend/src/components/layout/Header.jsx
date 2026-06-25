import { useState, useEffect, useRef } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

const CustomSelect = ({ value, onChange, options, isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-select-container" ref={containerRef} style={{ position: 'relative' }}>
      <button 
        type="button"
        className="header-select custom-select-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? (isMobile ? (selectedOption.mobileLabel || selectedOption.label) : selectedOption.label) : ''}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div 
          className="dropdown-menu" 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            marginTop: '6px', 
            minWidth: '120px', 
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="dropdown-item"
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
              style={{
                fontWeight: opt.value === value ? 600 : 500,
                color: opt.value === value ? 'var(--primary)' : 'var(--text)',
                backgroundColor: opt.value === value ? 'var(--bg)' : 'transparent',
                display: 'block',
                width: '100%',
                textAlign: 'left'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Header = ({ onMenuClick }) => {
  const { user, isGuest } = useAuth();
  const { locale, toggleLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h2 className="header-title">
          <span className="welcome-prefix">{t('welcome')}, </span>
          {user?.name || 'User'}!
        </h2>
        
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
          <span className="status-label">{isGuest ? t('statusOfflineMode') : t('statusCloudSync')}</span>
        </div>
      </div>

      {/* Settings (Language & Currency Switchers) */}
      <div className="header-settings">
        {/* Language Selector */}
        <CustomSelect
          value={locale}
          onChange={(e) => toggleLanguage(e.target.value)}
          options={[
            { value: 'vi', label: 'Tiếng Việt', mobileLabel: 'VN' },
            { value: 'en', label: 'English', mobileLabel: 'EN' }
          ]}
          isMobile={isMobile}
        />

        {/* Currency Switcher */}
        <CustomSelect
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={[
            { value: 'VND', label: 'VND (₫)', mobileLabel: 'VND' },
            { value: 'USD', label: 'USD ($)', mobileLabel: 'USD' }
          ]}
          isMobile={isMobile}
        />
      </div>
    </header>
  );
};

export default Header;