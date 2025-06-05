
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User, Check, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isLoading } = useAuth();

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const { strength, checks } = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strength < 3) {
      toast.error('Password is too weak. Please use a stronger password.');
      return;
    }
    
    try {
      await signup(name, email, password);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-md glass animate-fade-up">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-slate-800">Create account</CardTitle>
        <CardDescription className="text-center text-slate-600">
          Get started with your new workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 transition-all duration-300 focus:ring-2 focus:ring-blue-500"
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
            
            {password && (
              <div className="mt-2 space-y-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= strength
                          ? strength <= 2
                            ? 'bg-red-500'
                            : strength <= 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      } transition-colors duration-300`}
                    />
                  ))}
                </div>
                <div className="text-xs space-y-1">
                  {Object.entries(checks).map(([key, passed]) => (
                    <div key={key} className="flex items-center space-x-2">
                      {passed ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
                      )}
                      <span className={`text-xs ${passed ? 'text-green-600' : 'text-gray-500'}`}>
                        {key === 'length' && 'At least 8 characters'}
                        {key === 'lowercase' && 'One lowercase letter'}
                        {key === 'uppercase' && 'One uppercase letter'}
                        {key === 'number' && 'One number'}
                        {key === 'special' && 'One special character'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 ripple transition-all duration-300"
            disabled={isLoading || strength < 3}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
