import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Building,
  Shield,
  Clock,
  UserCheck
} from 'lucide-react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempt, setLoginAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setLoginAttempt(null);

  try {
    const response = await fetch("http://127.0.0.1:5000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email.trim(),
        password: formData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setLoginAttempt({
        success: false,
        message: data.message || data.error || "Login failed. Please try again.",
        isPending: data.status === "pending_approval",
      });
      return;
    }

    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }

    if (data.user) {
      localStorage.setItem("authUser", JSON.stringify(data.user));
    }

    setLoginAttempt({
      success: true,
      message: `Welcome back, ${data.user.full_name || data.user.first_name || "User"}!`,
      account: data.user,
    });

    onLogin?.(data.user);
  } catch (error) {
    console.error("Login error:", error);
    setLoginAttempt({
      success: false,
      message: "Unable to connect to the server. Please try again.",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
      <div className="max-w-md w-full px-4">
        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to GrantThrive
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Sign in to your account to continue
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="mailto:support@grantthrive.com" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>

              {/* Login Result */}
              {loginAttempt && (
                <div className={`p-4 rounded-lg border ${
                  loginAttempt.success 
                    ? 'bg-green-50 border-green-200' 
                    : loginAttempt.isPending
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {loginAttempt.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : loginAttempt.isPending ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${
                        loginAttempt.success 
                          ? 'text-green-900' 
                          : loginAttempt.isPending
                          ? 'text-yellow-900'
                          : 'text-red-900'
                      }`}>
                        {loginAttempt.message}
                      </p>
                      {loginAttempt.success && loginAttempt.account && (
                        <p className="text-xs text-green-700 mt-1">
                          Logging in as {loginAttempt.account.role}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-700 hover:bg-green-800"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            {/* Registration Link */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/portal/register" className="text-blue-600 hover:text-blue-500 font-medium">
                  Register here
                </a>
              </p>
            </div>
            {/* Account Status Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Account Status Information</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span><strong>Active:</strong> Full platform access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-yellow-600" />
                  <span><strong>Pending:</strong> Awaiting admin approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3 h-3 text-blue-600" />
                  <span><strong>Government Staff:</strong> Requires .gov.au or .govt.nz email verification</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

