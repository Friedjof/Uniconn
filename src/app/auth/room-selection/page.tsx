'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  number: string;
  capacity: number;
  description?: string;
}

export default function RoomSelectionPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Check session and load rooms
  useEffect(() => {
    const checkSessionAndLoadRooms = async () => {
      try {
        // Verify user session
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (!sessionResponse.ok) {
          router.push('/');
          return;
        }

        const sessionData = await sessionResponse.json();
        const user = sessionData.user;

        // Check if user has verified email
        if (!user.emailVerification?.isVerified) {
          router.push('/');
          return;
        }

        // Check if user already has a room
        if (user.roomId) {
          router.push('/auth/tenant-verification');
          return;
        }

        setUserEmail(user.email);

        // Load rooms
        const roomsResponse = await fetch('/api/rooms');
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
          setFilteredRooms(roomsData);
        } else {
          showError('Failed to load rooms');
        }
      } catch (error) {
        showError('An error occurred while loading data');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndLoadRooms();
  }, [router, showError]);

  const handleVerificationSubmit = async (e: React.FormEvent) => {
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
        showSuccess('Apartment verification successful! Welcome to UniConn!');
        
        // Add slide-out animation
        document.body.style.overflow = 'hidden';
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.style.transform = 'translateX(100%)';
          mainContent.style.transition = 'transform 0.5s ease-in-out';
        }
        
        setTimeout(() => {
          router.push('/');
        }, 500);
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

  // Filter rooms based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(room =>
        room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchTerm, rooms]);

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setSearchTerm(`${room.building} - Room ${room.number}`);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) {
      showError('Please select an apartment');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/select-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          userEmail,
        }),
      });

      if (response.ok) {
        showSuccess('Apartment selected successfully! Check your mailbox for the verification code.');
        setShowVerificationForm(true);
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to select apartment');
      }
    } catch (error) {
      showError('An error occurred while selecting the apartment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading apartments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-8">
          {!showVerificationForm ? (
            // Room Selection Form
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  Select Your Apartment
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Choose the apartment where you currently reside. After selection, we will verify your tenancy to ensure community security. A physical verification code will be delivered to your apartment's mailbox, which you'll need to enter to complete the verification process.
                </p>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Please select the correct apartment as this will be verified. Only residents with valid apartment access can complete the verification process.
                  </p>
                </div>
              </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label htmlFor="apartment-search" className="block text-sm font-medium text-foreground mb-2">
                Search and Select Apartment
              </label>
              <div className="relative">
                <input
                  id="apartment-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (!e.target.value) {
                      setSelectedRoom(null);
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="input pr-10"
                  placeholder="Search by building or room number..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Dropdown */}
              {isDropdownOpen && filteredRooms.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => handleRoomSelect(room)}
                      className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-secondary/50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-foreground">
                            {room.building} - Room {room.number}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {room.name} • Floor {room.floor} • Capacity: {room.capacity}
                          </div>
                          {room.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {room.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedRoom && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">Selected Apartment:</h3>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Building:</strong> {selectedRoom.building}</p>
                  <p><strong>Room:</strong> {selectedRoom.number}</p>
                  <p><strong>Floor:</strong> {selectedRoom.floor}</p>
                  <p><strong>Type:</strong> {selectedRoom.name}</p>
                  <p><strong>Capacity:</strong> {selectedRoom.capacity} person(s)</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !selectedRoom}
              className="btn btn-primary w-full py-3 text-base font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Selecting...</span>
                </div>
              ) : (
                'Continue to Verification'
              )}
            </button>
          </form>
            </>
          ) : (
            // Apartment Verification Form
            <>
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

              {selectedRoom && (
                <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Verification for:
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Building:</strong> {selectedRoom.building}</p>
                    <p><strong>Room:</strong> {selectedRoom.number}</p>
                    <p><strong>Floor:</strong> {selectedRoom.floor}</p>
                    <p><strong>Type:</strong> {selectedRoom.name}</p>
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

              <form onSubmit={handleVerificationSubmit} className="space-y-6">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}