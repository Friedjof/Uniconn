'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

type AuthState = 'login' | 'register' | 'verify-email';

export default function AuthPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [authState, setAuthState] = useState<AuthState>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    termsAccepted: false,
    privacyAccepted: false,
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]).{16,}$/;

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          
          // Redirect based on user state
          if (user.emailVerification && !user.emailVerification.isVerified) {
            setUserEmail(user.email);
            setAuthState('verify-email');
          } else if (!user.roomId) {
            router.push('/auth/room-selection');
          } else if (user.role === 'USER' && !user.isTenantVerified) {
            router.push('/auth/tenant-verification');
          } else {
            // User is fully verified, stay on main page (dashboard will be shown)
            setIsSessionChecked(true);
            return;
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsSessionChecked(true);
      }
    };

    checkSession();
  }, [router]);

  const validateRegisterForm = (): boolean => {
    const newErrors: any = {};

    if (!registerData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(registerData.password)) {
      newErrors.password = 'Password must be at least 16 characters long and contain uppercase letters, digits, and special characters';
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!registerData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!registerData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    if (!registerData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Terms of Service';
    }

    if (!registerData.privacyAccepted) {
      newErrors.privacyAccepted = 'You must accept the Privacy Policy';
    }

    if (Object.keys(newErrors).length > 0) {
      showError(Object.values(newErrors)[0] as string);
      return false;
    }

    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.user.emailVerification && !data.user.emailVerification.isVerified) {
          setUserEmail(loginData.email);
          setAuthState('verify-email');
        } else if (!data.user.roomId) {
          router.push('/auth/room-selection');
        } else if (data.user.role === 'USER' && !data.user.isTenantVerified) {
          router.push('/auth/tenant-verification');
        } else {
          // User is fully verified, reload page to show dashboard
          window.location.href = '/';
        }
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Login failed');
      }
    } catch (error) {
      showError('An error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          termsAccepted: registerData.termsAccepted,
          privacyAccepted: registerData.privacyAccepted,
        }),
      });

      if (response.ok) {
        setUserEmail(registerData.email);
        setAuthState('verify-email');
        showSuccess('Registration successful! Please check your email for verification.');
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Registration failed');
      }
    } catch (error) {
      showError('An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEmailVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          verificationCode,
        }),
      });

      if (response.ok) {
        showSuccess('Email verified successfully!');
        router.push('/auth/room-selection');
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Verification failed');
      }
    } catch (error) {
      showError('An error occurred during verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        showSuccess('Verification code sent successfully!');
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to resend verification code');
      }
    } catch (error) {
      showError('An error occurred while resending the code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = (newState: AuthState) => {
    if (isTransitioning || authState === newState) return;
    
    setIsTransitioning(true);
    
    // Smooth transition with proper timing
    setTimeout(() => {
      setAuthState(newState);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 200);
  };

  const infoContent = {
    login: {
      title: 'Welcome back',
      subtitle: 'UniConn',
      description: 'Sign in to reconnect with your dormitory community. Access your chats, view announcements, and stay connected with your neighbors.',
      features: [
        { icon: '🔐', text: 'Secure & Private Access' },
        { icon: '💬', text: 'Real-time Messaging' },
        { icon: '🏠', text: 'Room Management' }
      ]
    },
    register: {
      title: 'Join the',
      subtitle: 'Community',
      description: 'Create your account and become part of your dormitory\'s digital ecosystem. Connect, share, and thrive together.',
      features: [
        { icon: '🛡️', text: 'Secure Registration' },
        { icon: '📧', text: 'Email Verification' },
        { icon: '🔑', text: 'Strong Protection' }
      ]
    },
    'verify-email': {
      title: 'Almost there!',
      subtitle: 'Verify Email',
      description: 'Check your email inbox for the verification code. This final step ensures your account security and completes your registration.',
      features: [
        { icon: '📬', text: 'Check Your Inbox' },
        { icon: '🔒', text: 'Secure Verification' },
        { icon: '✅', text: 'Account Activation' }
      ]
    }
  };

  const currentInfo = infoContent[authState];

  // Show loading spinner while checking session
  if (!isSessionChecked) {
    return (
      <div className="h-screen bg-background pt-16 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background pt-16 overflow-hidden">
      <div className="flex h-full">
        {/* Left Side - Hero Section */}
        <div className="w-2/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
          <div className="absolute inset-0 bg-gradient-to-br from-card/40 to-transparent backdrop-blur-sm" />
          
          <div className="relative h-full flex items-center justify-center p-8">
            <div className={`max-w-sm text-center lg:text-left transition-all duration-500 ${authState === 'login' ? 'animate-slide-in-left' : authState === 'register' ? 'animate-slide-in-right' : 'animate-morph-in'}`}>
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  {currentInfo.title}
                  <span className="text-primary block">{currentInfo.subtitle}</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {currentInfo.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-sm">
                {currentInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-card/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <span className="text-lg">{feature.icon}</span>
                    </div>
                    <span className="text-muted-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-3/5 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div 
              ref={formRef}
              className={`card p-8 transition-all duration-700 ease-in-out ${
                isTransitioning ? 'transform scale-[0.98] opacity-70' : 'transform scale-100 opacity-100'
              }`}
              style={{
                minHeight: authState === 'login' ? '420px' : authState === 'register' ? '600px' : '500px',
                transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Toggle Header */}
              {authState !== 'verify-email' && (
                <div className="flex items-center justify-center mb-8">
                  <div className="relative flex items-center bg-secondary/30 rounded-full p-1 backdrop-blur-sm">
                    <div 
                      className={`absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-500 ease-in-out shadow-lg ${
                        authState === 'login' ? 'left-1 w-[calc(50%-0.125rem)]' : 'left-[calc(50%+0.125rem)] w-[calc(50%-0.125rem)]'
                      }`}
                    />
                    <button
                      onClick={() => authState !== 'login' && toggleMode('login')}
                      disabled={isTransitioning}
                      className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        authState === 'login' 
                          ? 'text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => authState !== 'register' && toggleMode('register')}
                      disabled={isTransitioning}
                      className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        authState === 'register' 
                          ? 'text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}
              
              {/* Email Verification Header */}
              {authState === 'verify-email' && (
                <div className="flex items-center justify-center mb-8">
                  <div className="bg-primary/10 rounded-full px-6 py-2 backdrop-blur-sm">
                    <span className="text-sm font-medium text-primary">Email Verification</span>
                  </div>
                </div>
              )}

              {/* Form Content */}
              <div className="relative">
                {/* Login Form */}
                <div 
                  className={`transition-all duration-600 ease-in-out ${
                    authState === 'login' && !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                  }`}
                >
                  {/* Login Form */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Welcome back
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Enter your credentials to access your account
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-2">
                          Email address
                        </label>
                        <input
                          id="login-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={loginData.email}
                          onChange={handleLoginChange}
                          className="input"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-2">
                          Password
                        </label>
                        <input
                          id="login-password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={loginData.password}
                          onChange={handleLoginChange}
                          className="input"
                          placeholder="Enter your password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary w-full py-3 text-base font-medium mt-6"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        'Sign in'
                      )}
                    </button>
                  </form>
                </div>

                {/* Register Form */}
                <div 
                  className={`absolute top-0 left-0 w-full transition-all duration-600 ease-in-out ${
                    authState === 'register' && !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                  }`}
                >
                  {/* Register Form */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Create your account
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Join the UniConn community today
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-2">
                          Email address
                        </label>
                        <input
                          id="register-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          className="input"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                            First name
                          </label>
                          <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            value={registerData.firstName}
                            onChange={handleRegisterChange}
                            className="input"
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                            Last name
                          </label>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            value={registerData.lastName}
                            onChange={handleRegisterChange}
                            className="input"
                            placeholder="Last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-2">
                          Password
                        </label>
                        <input
                          id="register-password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          className="input"
                          placeholder="Create a secure password"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          16+ characters with uppercase, numbers, and symbols
                        </p>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                          Confirm Password
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          required
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          className="input"
                          placeholder="Confirm your password"
                        />
                      </div>

                      <div className="flex items-center justify-center space-x-3 pt-4 px-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRegisterChange({ target: { name: 'termsAccepted', type: 'checkbox', checked: !registerData.termsAccepted } } as any);
                          }}
                          className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                            registerData.termsAccepted
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mr-2 transition-colors ${
                            registerData.termsAccepted ? 'bg-primary-foreground' : 'bg-muted-foreground/40'
                          }`} />
                          <span className="pointer-events-none">
                            Accept{' '}
                            <Link href="/terms" className="underline hover:opacity-80 transition-opacity pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                              Terms
                            </Link>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRegisterChange({ target: { name: 'privacyAccepted', type: 'checkbox', checked: !registerData.privacyAccepted } } as any);
                          }}
                          className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                            registerData.privacyAccepted
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mr-2 transition-colors ${
                            registerData.privacyAccepted ? 'bg-primary-foreground' : 'bg-muted-foreground/40'
                          }`} />
                          <span className="pointer-events-none">
                            Accept{' '}
                            <Link href="/privacy" className="underline hover:opacity-80 transition-opacity pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                              Privacy
                            </Link>
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary w-full py-3 text-base font-medium mt-6"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        'Create account'
                      )}
                    </button>
                  </form>
                </div>

                {/* Email Verification Form */}
                <div 
                  className={`absolute top-0 left-0 w-full transition-all duration-600 ease-in-out ${
                    authState === 'verify-email' && !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                  }`}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-foreground mb-3">
                      Verify your email
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Enter the 6-digit code sent to <strong>{userEmail}</strong>
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleEmailVerificationSubmit}>
                    <div>
                      <input
                        id="verificationCode"
                        name="verificationCode"
                        type="text"
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="input text-center font-mono text-2xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !verificationCode}
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
                        'Verify Email'
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={handleResendVerification}
                      disabled={isSubmitting}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Resend verification code
                    </button>
                  </div>
                </div>
              </div>


              {/* Footer */}
              {authState !== 'register' && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
