'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

export default function TenantVerificationPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoom, setUserRoom] = useState<any>(null);

  // Check session and user state
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/');
          return;
        }

        const data = await response.json();
        const user = data.user;

        // Check if user has verified email
        if (!user.emailVerification?.isVerified) {
          router.push('/');
          return;
        }

        // Check if user has selected a room
        if (!user.roomId) {
          router.push('/auth/room-selection');
          return;
        }

        // Check if user is already tenant verified
        if (user.isTenantVerified) {
          router.push('/dashboard');
          return;
        }

        setUserRoom(user.room);
      } catch (error) {
        showError('An error occurred while loading data');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      showError('Please enter a valid 6-character verification code');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/verify-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationCode,
        }),
      });

      if (response.ok) {
        showSuccess('Tenant verification successful! Welcome to UniConn!');
        
        // Add slide-out animation
        document.body.style.overflow = 'hidden';
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.style.transform = 'translateX(100%)';
          mainContent.style.transition = 'transform 0.5s ease-in-out';
        }
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Tenant verification failed');
      }
    } catch (error) {
      showError('An error occurred during tenant verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Apartment Verification
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Almost done! Enter the 6-character verification code that was delivered to your apartment mailbox to complete your registration.
            </p>
          </div>

          {userRoom && (
            <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-lg">
              <h3 className="font-semibold text-foreground mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Verification for:
              </h3>
              <div className="text-sm text-muted-foreground">
                <p><strong>Building:</strong> {userRoom.building}</p>
                <p><strong>Room:</strong> {userRoom.number}</p>
                <p><strong>Floor:</strong> {userRoom.floor}</p>
              </div>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Verification Code Delivery
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    A physical verification code has been delivered to your apartment mailbox. 
                    Please check your mailbox and enter the 6-character code below to complete your registration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-foreground mb-2">
                Apartment Verification Code
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="input text-center font-mono text-2xl tracking-widest"
                placeholder="ABC123"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Enter the 6-character code from your mailbox (numbers and letters only)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || verificationCode.length !== 6}
              className="btn btn-primary w-full py-3 text-base font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Can't find your verification code?
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Check your apartment mailbox thoroughly</p>
                <p>• Look for a sealed envelope with "UniConn Verification"</p>
                <p>• Contact building management for assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}