
import React from 'react';
import { authService } from '../services/db';
import { Icon } from '../components/Shared';

export const LoginScreen = () => {
  const handleLogin = async () => {
    try {
      await authService.login();
    } catch (e) {
      console.error("Login failed", e);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-800 p-4 rounded-full mb-6 ring-4 ring-slate-700">
        <Icon name="briefcase" className="w-12 h-12 text-blue-400" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2 tracking-tight">ProPaint</h1>
      <p className="text-slate-400 mb-12 max-w-xs mx-auto">
        Professional estimating software for contractors. Cloud-synced & secure.
      </p>

      <button
        onClick={handleLogin}
        className="bg-white text-slate-900 w-full max-w-xs py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-50 transition-transform active:scale-95 flex items-center justify-center gap-3"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>

      <p className="text-slate-500 text-xs mt-8">
        By signing in, you agree to our Terms of Service.<br/>
        Your data is securely stored on Google Cloud.
      </p>
    </div>
  );
};

export const PaywallScreen = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 p-4 rounded-full mb-6 ring-4 ring-yellow-500/30">
                <Icon name="dollar" className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Premium Access Required</h1>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                ProPaint Estimator is a premium tool for professional contractors. 
            </p>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-xs mb-8">
                <ul className="text-left text-sm text-slate-300 space-y-3">
                    <li className="flex items-center gap-2"><Icon name="plus" className="text-green-400 w-4 h-4"/> Unlimited Estimates</li>
                    <li className="flex items-center gap-2"><Icon name="plus" className="text-green-400 w-4 h-4"/> Client Management</li>
                    <li className="flex items-center gap-2"><Icon name="plus" className="text-green-400 w-4 h-4"/> AI-Assisted Measuring</li>
                    <li className="flex items-center gap-2"><Icon name="plus" className="text-green-400 w-4 h-4"/> Cloud Backup</li>
                </ul>
            </div>
            
            <a 
                href="mailto:support@propaintestimator.com?subject=Upgrade%20to%20Pro"
                className="bg-secondary text-white w-full max-w-xs py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-600 transition-colors mb-4 block"
            >
                Contact Sales to Upgrade
            </a>

            <button
                onClick={() => authService.logout()}
                className="text-slate-500 text-sm hover:text-white transition-colors font-medium"
            >
                Sign Out
            </button>
        </div>
    );
};
