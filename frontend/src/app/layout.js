import './globals.css';

import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Parise API — Control Center',
  description: 'Monitor and manage your backend API, files, secrets, and integrations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
