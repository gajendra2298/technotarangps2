import { User, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Button } from './ui';
import { useAppSelector } from '../redux/hooks';
import { useUser, UserButton } from '@clerk/clerk-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface NavbarProps {
  onProfileClick: () => void;
  onLogoClick: () => void;
}

export function Navbar({ onProfileClick, onLogoClick }: NavbarProps) {
  const { role } = useAppSelector(state => state.auth);
  const { isSignedIn } = useUser();
  const { status } = useAccount();

  // While wagmi is reconnecting to a previously connected wallet on page reload,
  // show a skeleton so the user doesn't see a "Connect Wallet" flash.
  const isReconnecting = status === 'reconnecting' || status === 'connecting';

  return (
    <nav className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-white italic">E</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-bold tracking-tight">EscrowAI</span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Decentralized Trust
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isSignedIn && (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onLogoClick} className="gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={onProfileClick} className="gap-2">
                <User className="w-4 h-4" /> Profile
              </Button>
              
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border ml-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-muted-foreground uppercase">{role || 'GUEST'}</span>
              </div>
            </div>
          )}
          
          {/* Show a loading skeleton while wagmi is reconnecting to avoid the "Connect Wallet" flash */}
          {isReconnecting ? (
            <div className="h-10 w-36 rounded-xl bg-secondary/60 animate-pulse border border-border" />
          ) : (
            <ConnectButton 
              accountStatus="avatar" 
              showBalance={false}
            />
          )}
          
          {isSignedIn && (
            <div className="flex items-center gap-2 border-l pl-4">
               <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 border border-primary/20"
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

