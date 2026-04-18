import { useState } from 'react';
import { authApi } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep('VERIFY');
      toast.success('OTP sent to your email');
    } catch (err) {
      toast.error('Failed to send OTP. Is the email correct?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      toast.success('Identity verified! For security, please proceed to reset your password via Clerk.');
    } catch (err) {
      toast.error('Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-20">
      <Card className="glass shadow-2xl overflow-hidden border-primary/20">
        <div className="h-2 bg-primary"></div>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Security Recovery</CardTitle>
          <p className="text-muted-foreground text-sm">
            {step === 'REQUEST' ? 'Enter your email to receive a code' : 'Enter the 6-digit code sent to you'}
          </p>
        </CardHeader>
        <CardContent>
          {step === 'REQUEST' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="text" 
                  placeholder="000000" 
                  value={otp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-2xl tracking-[1em] font-bold"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button variant="ghost" className="w-full text-xs" onClick={() => setStep('REQUEST')}>
                Resend code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
