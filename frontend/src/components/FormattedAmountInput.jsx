import React, { useState } from 'react';
import { formatInputAmountWithDots } from '../utils/constants';

const FormattedAmountInput = ({ value, onChange, placeholder, className, required, autoFocus, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    const raw = e.target.value;
    onChange(raw);
  };

  const formatted = formatInputAmountWithDots(value);

  return (
    <div style={{ position: 'relative', width: '100%', backgroundColor: '#fff', borderRadius: '8px' }}>
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        .custom-caret {
          display: inline-block;
          width: 1.5px;
          height: 18px;
          background-color: var(--text, #374151);
          margin-left: 1px;
          animation: blink 1.1s step-end infinite;
          vertical-align: middle;
        }
      `}</style>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=""
        className={`${className} no-spinner`}
        required={required}
        autoFocus={autoFocus}
        style={{
          color: 'transparent',
          caretColor: 'transparent',
          background: 'transparent',
          position: 'relative',
          zIndex: 2,
        }}
        {...props}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.4',
          color: value ? 'var(--text)' : '#9ca3af',
        }}
      >
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>{formatted}</span>
            {isFocused && <span className="custom-caret" />}
          </div>
        ) : (
          <>
            {isFocused ? (
              <span className="custom-caret" />
            ) : (
              placeholder
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FormattedAmountInput;
