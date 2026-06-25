// src/App.jsx

import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { router } from './router';

function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

export default App;