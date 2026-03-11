'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginCustomer, registerCustomer } from '@/lib/firebase/auth';
import { User, Lock, Mail, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await loginCustomer(email, password);
      } else {
        await registerCustomer(email, password, name);
      }
      router.push('/customer/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Authentication failed. Please try again.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-background/50 relative overflow-hidden">
      {/* Back Button */}
      <button 
        onClick={() => router.push('/')} 
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-foreground-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-medium">Home</span>
      </button>

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-glow-cyan rounded-full mix-blend-screen filter blur-[128px] opacity-50"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-glow-violet rounded-full mix-blend-screen filter blur-[128px] opacity-50"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Queue Seva <span className="text-cyan-500">Customer</span>
            </h1>
            <p className="text-foreground-muted">
              {isLogin ? 'Welcome back! Login to book slots.' : 'Create an account to join queues.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-muted">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-foreground/10 rounded-xl bg-background-card text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-sm"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-foreground/10 rounded-xl bg-background-card text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-sm"
                  placeholder="customer@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-muted">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-foreground/10 rounded-xl bg-background-card text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                className="text-red-500 text-sm"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-background bg-foreground hover:bg-foreground/90 glow-effect focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-cyan-600 hover:text-cyan-500 transition-colors font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
