import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('git_token', token);
            // Redirect to deployment page after a short delay to ensure storage
            setTimeout(() => {
                navigate('/deploy/new');
            }, 500);
        } else {
            navigate('/');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <h2 className="text-xl font-bold">Connecting GitHub...</h2>
            <p className="text-gray-400">Please wait while we verify your credentials.</p>
        </div>
    );
}
