import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { DemoRoleBar } from '../components/layout/DemoRoleBar';

export const metadata: Metadata = {
  title: 'MIRAI CLUBS — Club Activities Tracker | Mirai School of Technology',
  description:
    'Official co-curricular activity and club management platform for Mirai School of Technology (MSOT Challenge Problem 5).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            <DemoRoleBar />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
