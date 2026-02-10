import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig'; // Adjust the path if authContext is in a subfolder (e.g., '../apiConfig')

axios.defaults.baseURL = API_BASE_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        token: localStorage.getItem('token'),
        user: JSON.parse(localStorage.getItem('user'))
    });
    const [website, setWebsite] = useState({ name: "Tempest" }); // before calling the database default name is Tempest1

    // Idle timeout state
    const [isIdle, setIsIdle] = useState(false);
    const [countdown, setCountdown] = useState(5); // Countdown seconds
    const idleTimerRef = useRef(null);
    const countdownTimerRef = useRef(null);

    //const IDLE_TIMEOUT = 5 * 1000; // 5 seconds.
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes.

    useEffect(() => {
        if (auth.token) {
            // Set the token in axios headers for all subsequent requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
            localStorage.setItem('token', auth.token);
            localStorage.setItem('user', JSON.stringify(auth.user));
        } else {
            // Clear the token from axios headers
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }, [auth]);

    useEffect(() => {
        const fetchWebsiteData = async () => {
            try {
                // Using /websites/1 as it is more conventional for REST APIs
                const result = await axios.get('/website/1');
                setWebsite(result.data);
            } catch (error) {
                console.error("Could not fetch website data", error);
                setWebsite({ name: "Tempest" }); // Fallback name
            }
        };
        fetchWebsiteData();
    }, []);

    const login = (token, user) => {
        setAuth({ token, user });
    };

    const logout = useCallback(() => {
        setAuth({ token: null, user: null });
        // Stop timers on logout
        clearTimeout(idleTimerRef.current);
        clearInterval(countdownTimerRef.current);
        setIsIdle(false);
    }, []);

    const handleContinueSession = () => {
        setIsIdle(false);
        clearInterval(countdownTimerRef.current);
        resetIdleTimer();
    };

    const handleSignOut = () => {
        logout();
    };

    const resetIdleTimer = useCallback(() => {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            setIsIdle(true);
        }, IDLE_TIMEOUT);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isIdle) {
            setCountdown(5); // Reset countdown
            countdownTimerRef.current = setInterval(() => {
                setCountdown(prevCountdown => {
                    if (prevCountdown <= 1) {
                        clearInterval(countdownTimerRef.current);
                        logout();
                        return 0;
                    }
                    return prevCountdown - 1;
                });
            }, 1000);
        }

        return () => clearInterval(countdownTimerRef.current);
    }, [isIdle, logout]);

    useEffect(() => {
        if (auth.user) {
            const events = ['mousemove', 'keydown', 'click', 'scroll'];
            events.forEach(event => window.addEventListener(event, resetIdleTimer));
            resetIdleTimer(); // Initial start

            return () => {
                events.forEach(event => window.removeEventListener(event, resetIdleTimer));
                clearTimeout(idleTimerRef.current);
            };
        }
    }, [auth.user, resetIdleTimer]);

    return (
        <AuthContext.Provider value={{ auth, login, logout, website, isIdle, countdown, handleContinueSession, handleSignOut }}>
            {children}
        </AuthContext.Provider>
    );
};