import React from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig';

interface LoginProps {
    onNavigate: (view: 'register' | 'home') => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const emailInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in App.tsx will handle navigation to 'home'
        } catch (error: any) {
            switch (error.code) {
                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Invalid email or password.');
                    break;
                default:
                    setError('An unexpected error occurred. Please try again.');
                    break;
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 px-4 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 mt-2">Log in to continue your application.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                ref={emailInputRef}
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="text-red-600 text-center text-sm font-semibold">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Log In'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <button onClick={() => onNavigate('register')} className="font-medium text-orange-600 hover:text-orange-500">
                                Register here
                            </button>
                        </p>
                    </div>
                </div>
                 <p className="text-center text-gray-500 text-sm mt-6">
                    <button onClick={() => onNavigate('home')} className="hover:underline">
                        <i className="fa-solid fa-arrow-left mr-1"></i> Back to Home
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
