import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSystemInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Check if system is already initialized by checking for admin users
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (count && count > 0) {
          setIsInitialized(true);
          setIsInitializing(false);
          return;
        }

        // Call initialization function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-system`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('System initialization:', data);
          setIsInitialized(true);
        } else {
          console.error('Failed to initialize system:', await response.text());
        }
      } catch (error) {
        console.error('System initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSystem();
  }, []);

  return { isInitialized, isInitializing };
};
