import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Pastiin nama file CSS Tailwind lu bener (biasanya index.css)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setup mesin cache TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Biar nggak nge-fetch terus tiap pindah tab Chrome
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);