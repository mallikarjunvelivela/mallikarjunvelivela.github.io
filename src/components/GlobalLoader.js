import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './GlobalLoader.css';

const GlobalLoader = () => {
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();

    // Hide loader when the route changes (navigation completes)
    useEffect(() => {
        setIsLoading(false);
    }, [location]);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                setIsLoading(false);
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            const target = e.target;
            const loaderElement = target.closest('.loader');
            const anchorElement = target.closest('a');
            const submitButton = target.closest('button[type="submit"]');

            let shouldLoad = false;

            if (loaderElement) {
                shouldLoad = true;
            } else if (anchorElement) {
                const href = anchorElement.getAttribute('href');
                const targetAttr = anchorElement.getAttribute('target');
                
                if (href && !href.startsWith('#') && !href.startsWith('javascript') && !href.startsWith('mailto') && targetAttr !== '_blank') {
                    shouldLoad = true;
                }
            } else if (submitButton) {
                shouldLoad = true;
            }

            if (shouldLoad) {
                setIsLoading(true);
                
                // Safety fallback: hide loader after 60 seconds to accommodate Render cold starts
                setTimeout(() => {
                    setIsLoading(false);
                }, 60000);
            }
        };

        document.addEventListener('click', handleGlobalClick);

        // Cleanup listener on unmount
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div className="loader-overlay">
            <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};

export default GlobalLoader;