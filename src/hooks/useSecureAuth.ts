
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { rateLimiter, validateEmail, validatePassword } from '@/utils/securityEnhancements';
import { toast } from '@/hooks/use-toast';

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

export const useSecureAuth = () => {
  const { signIn, signUp, signOut } = useAuth();
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);

  // Secure login with rate limiting and logging
  const secureSignIn = useCallback(async (email: string, password: string) => {
    const clientId = `login_${email}`;
    
    // Check rate limiting (5 attempts per 15 minutes)
    if (rateLimiter.isRateLimited(clientId, 5, 15 * 60 * 1000)) {
      await logSecurityEvent('LOGIN_RATE_LIMITED', `Too many login attempts for ${email}`);
      toast({
        title: 'Error',
        description: 'Too many login attempts. Please try again later.',
        variant: 'destructive',
      });
      return { error: { message: 'Rate limited' } };
    }

    // Validate email format
    if (!validateEmail(email)) {
      await logSecurityEvent('LOGIN_INVALID_EMAIL', `Invalid email format: ${email}`);
      return { error: { message: 'Invalid email format' } };
    }

    // Record attempt
    rateLimiter.recordAttempt(clientId);

    try {
      const result = await signIn(email, password);
      
      const attempt: LoginAttempt = {
        email,
        timestamp: Date.now(),
        success: !result.error
      };
      
      setLoginAttempts(prev => [...prev.slice(-9), attempt]);
      
      if (result.error) {
        await logSecurityEvent('LOGIN_FAILED', `Failed login attempt for ${email}`, {
          error: result.error.message
        });
      } else {
        // Get the current user after successful login
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.rpc('log_user_login', {
          p_user_id: user?.id || null,
          p_metadata: {
            email: email,
            login_method: 'password',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    } catch (error) {
      await logSecurityEvent('LOGIN_ERROR', `Login error for ${email}`, { error });
      return { error };
    }
  }, [signIn]);

  // Secure signup with validation
  const secureSignUp = useCallback(async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ) => {
    // Validate email
    if (!validateEmail(email)) {
      await logSecurityEvent('SIGNUP_INVALID_EMAIL', `Invalid email format: ${email}`);
      return { error: { message: 'Invalid email format' } };
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      await logSecurityEvent('SIGNUP_WEAK_PASSWORD', `Weak password attempt for ${email}`);
      return { 
        error: { 
          message: `Password requirements not met: ${passwordValidation.errors.join(', ')}` 
        } 
      };
    }

    try {
      const result = await signUp(email, password, firstName, lastName);
      
      if (result.error) {
        await logSecurityEvent('SIGNUP_FAILED', `Failed signup attempt for ${email}`, {
          error: result.error.message
        });
      } else {
        await logSecurityEvent('SIGNUP_SUCCESS', `Successful signup for ${email}`);
      }
      
      return result;
    } catch (error) {
      await logSecurityEvent('SIGNUP_ERROR', `Signup error for ${email}`, { error });
      return { error };
    }
  }, [signUp]);

  // Secure logout with logging
  const secureSignOut = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Registrar logout usando la nueva función
      if (user) {
        await supabase.rpc('log_user_logout', {
          p_user_id: user.id,
          p_metadata: {
            logout_method: 'manual',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      await signOut();
    } catch (error) {
      await logSecurityEvent('LOGOUT_ERROR', 'Error during logout', { error });
      throw error;
    }
  }, [signOut]);

  // Helper function for logging security events - only for critical events
  const logSecurityEvent = async (eventType: string, description: string, metadata?: any) => {
    // Skip logging for routine view operations
    if (eventType.includes('VIEW_ATTEMPT') || eventType.includes('REPORT_VIEW') || eventType.includes('DATA_VIEW')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_description: description,
        p_user_id: null,
        p_metadata: metadata || {}
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  return {
    secureSignIn,
    secureSignUp,
    secureSignOut,
    loginAttempts
  };
};
