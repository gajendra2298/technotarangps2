import '@rainbow-me/rainbowkit/styles.css';
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/Profile';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { Navbar } from './components/Navbar';
import { Toaster } from 'sonner';
import { AuthWatcher } from './components/AuthWatcher';
import { AuthProvider } from './context/AuthContext';
import { useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from './components/ui';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const IS_CONFIGURED = CLERK_KEY && !CLERK_KEY.includes('placeholder');

const config = getDefaultConfig({
  appName: 'Freelance Escrow',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'dummy_id',
  chains: [polygonAmoy],
  ssr: false,
});

const queryClient = new QueryClient();

function MissingConfig() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
      <div className="max-w-md w-full p-8 bg-card rounded-3xl border shadow-2xl space-y-6 text-center glass relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-warning animate-pulse" />
        <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-warning/20">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuration Required</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            We couldn't detect your Clerk Publishable Key in the <code className="bg-secondary px-1.5 py-0.5 rounded text-primary">.env</code> file.
          </p>
        </div>

        <div className="bg-secondary/30 p-4 rounded-xl text-left text-xs font-mono space-y-2 border border-border">
          <p className="text-muted-foreground"># Create a .env file and add:</p>
          <p className="text-primary">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</p>
        </div>

        <div className="space-y-3 pt-2">
          <Button 
            className="w-full gap-2" 
            onClick={() => window.open('https://dashboard.clerk.com/last-active?path=api-keys', '_blank')}
          >
            Get Keys from Clerk <ExternalLink className="w-4 h-4" />
          </Button>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Restart the dev server after adding keys
          </p>
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const [currentPage, setCurrentPage] = useState<'DASHBOARD' | 'PROFILE'>('DASHBOARD');

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Toaster position="top-center" richColors />
      <AuthWatcher />
      <Navbar onProfileClick={() => setCurrentPage('PROFILE')} onLogoClick={() => setCurrentPage('DASHBOARD')} />
      
      <main className="container mx-auto px-4 py-8">
        <SignedOut>
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="w-full max-w-sm mb-8">
               <ForgotPasswordPage />
            </div>
            <div className="w-full max-w-md p-8 bg-card rounded-2xl border glass shadow-2xl">
              <h1 className="text-3xl font-bold text-center mb-6">Welcome back</h1>
              <SignIn routing="hash" />
            </div>
          </div>
        </SignedOut>
        
        <SignedIn>
          {currentPage === 'DASHBOARD' ? <Dashboard /> : <ProfilePage />}
        </SignedIn>
      </main>
    </div>
  );
}

function App() {
  if (!IS_CONFIGURED) {
    return <MissingConfig />;
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <Provider store={store}>
        <AuthProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider 
                theme={darkTheme({
                  accentColor: '#7c3aed',
                  borderRadius: 'large',
                })}
              >
                <AppLayout />
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </AuthProvider>
      </Provider>
    </ClerkProvider>
  );
}

export default App;
