import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { SupabaseProvider, useSupabase } from '@/hooks/useSupabase';
import LandingPage from '@/components/LandingPage';
import AdminDashboard from '@/components/AdminDashboard';
import UserDashboard from '@/components/UserDashboard';
import { Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { User } from '@supabase/supabase-js';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

interface AppContentProps {
  // Props interface - currently no props needed
}

const AppContent: React.FC<AppContentProps> = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTransition, setPageTransition] = useState(false);
  
  const { user, loading, signOut } = useSupabase();

  // Initialize smooth scrolling behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Check authentication status
  useEffect(() => {
    if (!loading) {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        
        // Check if user is admin (you can customize this logic)
        const userMetadata = user.user_metadata || {};
        const isUserAdmin = userMetadata.role === 'admin' || user.email?.includes('admin');
        setIsAdmin(isUserAdmin);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    }
  }, [user, loading]);

  // Handle authentication success
  const handleAuthSuccess = async (authUser: User, adminStatus: boolean) => {
    setPageTransition(true);
    
    // GSAP page transition animation
    await new Promise(resolve => {
      gsap.to('body', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsAuthenticated(true);
          setCurrentUser(authUser);
          setIsAdmin(adminStatus);
          
          gsap.to('body', {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
              setPageTransition(false);
              resolve(true);
            }
          });
        }
      });
    });
  };

  // Handle sign out
  const handleSignOut = async () => {
    setPageTransition(true);
    
    await new Promise(resolve => {
      gsap.to('body', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: async () => {
          await signOut();
          setIsAuthenticated(false);
          setCurrentUser(null);
          setIsAdmin(false);
          
          gsap.to('body', {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
              setPageTransition(false);
              resolve(true);
            }
          });
        }
      });
    });
  };

  // Loading screen
  if (isLoading || pageTransition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative">
            <Loader2 className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-4" />
            <motion.div
              className="absolute inset-0 h-16 w-16 border-4 border-blue-400/20 rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <motion.h1 
            className="text-2xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Aegis Vision
          </motion.h1>
          <motion.p 
            className="text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {isLoading ? 'Initializing...' : 'Transitioning...'}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/" 
              element={
                !isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <LandingPage onAuthSuccess={handleAuthSuccess} />
                  </motion.div>
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {isAdmin ? (
                      <AdminDashboard user={currentUser} onSignOut={handleSignOut} />
                    ) : (
                      <UserDashboard user={currentUser} onSignOut={handleSignOut} />
                    )}
                  </motion.div>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Catch all route */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} 
            />
          </Routes>
        </AnimatePresence>

        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
        />
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
};

export default App;