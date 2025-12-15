import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-utils';
import { toast } from 'sonner';

type Step = 'identify' | 'reset';

export default function Settings() {
  const [step, setStep] = useState<Step>('identify');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Identify user
  const [usernameEmailOrMobile, setUsernameEmailOrMobile] = useState('');
  const [userData, setUserData] = useState<{
    user_id: string;
    user_name: string;
    email: string;
    mobile_number: string | null;
  } | null>(null);

  // Step 2: Reset password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleIdentifyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!usernameEmailOrMobile.trim()) {
      setError('Please enter your username, email, or mobile number');
      return;
    }

    setIsLoading(true);
    try {
      // Find user by email, mobile number, or user name
      const { data, error: findError } = await supabase
        .from('users')
        .select('user_id, mobile_number, user_name, email')
        .or(`email.eq.${usernameEmailOrMobile},mobile_number.eq.${usernameEmailOrMobile},user_name.ilike.%${usernameEmailOrMobile}%`)
        .single();

      if (findError || !data) {
        setError('User not found. Please check your username, email, or mobile number.');
        setIsLoading(false);
        return;
      }

      setUserData({
        user_id: data.user_id,
        mobile_number: data.mobile_number,
        user_name: data.user_name,
        email: data.email,
      });

      toast.success('User verified successfully');
      setStep('reset');
      setSuccess('User verified. Please enter your new password.');
    } catch (err: any) {
      console.error('Error finding user:', err);
      setError(err.message || 'Failed to verify user. Please try again.');
      toast.error('Failed to verify user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!userData) {
      setError('User data not found. Please start over.');
      return;
    }

    setIsLoading(true);
    try {
      // Hash new password
      const passwordHash = hashPassword(newPassword);

      // Update password in our custom users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('user_id', userData.user_id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Password changed successfully!');
      setSuccess('Password changed successfully! You can now login with your new password.');

      // Reset form after 2 seconds
      setTimeout(() => {
        setStep('identify');
        setUsernameEmailOrMobile('');
        setNewPassword('');
        setConfirmPassword('');
        setUserData(null);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to change password. Please try again.');
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('identify');
    setUsernameEmailOrMobile('');
    setNewPassword('');
    setConfirmPassword('');
    setUserData(null);
    setError('');
    setSuccess('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Reset your password by verifying your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'identify' && (
              <form onSubmit={handleIdentifyUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usernameEmailOrMobile">Username, Email, or Mobile Number</Label>
                  <Input
                    id="usernameEmailOrMobile"
                    type="text"
                    value={usernameEmailOrMobile}
                    onChange={(e) => setUsernameEmailOrMobile(e.target.value)}
                    placeholder="Enter your username, email, or mobile number"
                    disabled={isLoading}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    We'll verify your account and allow you to change your password
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify User'
                  )}
                </Button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {userData && (
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Verified User:</p>
                    <p className="text-sm text-muted-foreground">Name: {userData.user_name}</p>
                    <p className="text-sm text-muted-foreground">Email: {userData.email}</p>
                    {userData.mobile_number && (
                      <p className="text-sm text-muted-foreground">Mobile: {userData.mobile_number}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
