import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

const FormattedAmountInput = ({ value, onChange, placeholder, className, required, autoFocus, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const EXCHANGE_RATE = 25400;

  const getPlaceholderText = () => {
    if (placeholder) {
      if (currency === 'USD') {
        let clean = placeholder;
        if (clean.includes('1.000.000')) clean = clean.replace('1.000.000', '100');
        if (clean.includes('260.000')) clean = clean.replace('260.000', '10');
        if (clean.includes('30.000.000')) clean = clean.replace('30.000.000', '1,000');
        return clean;
      }
      return placeholder;
    }
    return currency === 'USD' ? t('usdPlaceholder') : t('vndPlaceholder');
  };

  const handleChange = (e) => {
    // Keep only digits to ensure clean integer values
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };

  // Helper to format the blurred value
  const getBlurredValue = () => {
    if (value === null || value === undefined || value === '') return '';
    const clean = value.toString().replace(/\D/g, '');
    if (currency === 'USD') {
      // Format USD: commas as thousand separators
      return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      // Format VND: dots as thousand separators
      return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  };

  const formatted = getBlurredValue();

  // When focused: show raw number (type="number") for native selection & editing
  // When blurred: show formatted string (type="text") for clean display
  const displayValue = isFocused ? value : formatted;
  const inputType = isFocused ? 'number' : 'text';

  // Real-time helper conversion as they type
  const getHelperText = () => {
    if (!value) return '';
    const numeric = parseFloat(value);
    if (isNaN(numeric)) return '';

    if (currency === 'USD') {
      const formattedSelf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric);
      const vndVal = Math.round(numeric * EXCHANGE_RATE);
      const formattedConv = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(vndVal);
      return `${formattedSelf} (≈ ${formattedConv})`;
    } else {
      const formattedSelf = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(numeric);
      const usdVal = numeric / EXCHANGE_RATE;
      const formattedConv = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdVal);
      return `${formattedSelf} (≈ ${formattedConv})`;
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
        @keyframes fadeInHelper {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vnd-helper-text {
          animation: fadeInHelper 0.15s ease-out forwards;
        }
      `}</style>
      <input
        type={inputType}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? "" : getPlaceholderText()}
        className={`${className} no-spinner`}
        required={required}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          boxSizing: 'border-box'
        }}
        {...props}
      />
      {isFocused && value && (
        <span 
          className="vnd-helper-text"
          style={{ 
            fontSize: '12.5px', 
            color: '#4f46e5', // var(--primary-dark)
            fontWeight: '600', 
            marginTop: '6px',
            textAlign: 'right',
            alignSelf: 'flex-end',
            display: 'block',
            letterSpacing: '0.02em'
          }}
        >
          {getHelperText()}
        </span>
      )}
    </div>
  );
};

export default FormattedAmountInput;


