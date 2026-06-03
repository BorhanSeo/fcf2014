import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';
import { PiggyBank, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-primary/10 rounded-b-[100px] blur-3xl -z-10"></div>
      
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto flex items-center justify-center mb-4">
            <img src="/logo.png" alt="FCF 2014 Logo" className="w-full h-full object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">FCF 2014</h1>
          <p className="text-text-secondary font-bangla">FCF 2014 (Friend Circle Family) বিনিয়োগ ম্যানেজমেন্ট</p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-xl">
          <CardBody className="p-8">
            <h2 className="text-xl font-semibold text-text-primary mb-6 font-bangla text-center">
              অ্যাকাউন্টে প্রবেশ করুন
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="ইমেইল অ্যাড্রেস"
                type="email"
                placeholder="আপনার ইমেইল দিন"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
              />
              
              <div className="space-y-1">
                <Input
                  label="পাসওয়ার্ড"
                  type="password"
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  required
                />
                <div className="text-right">
                  <a href="#" className="text-sm text-primary hover:underline font-bangla">
                    পাসওয়ার্ড ভুলে গেছেন?
                  </a>
                </div>
              </div>

              {error && (
                <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm font-bangla animate-slide-in">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                loading={isLoading}
              >
                লগইন করুন
              </Button>
            </form>
          </CardBody>
        </Card>
        
        <p className="text-center text-sm text-text-muted mt-8 font-bangla">
          © {new Date().getFullYear()} FCF 2014। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>
    </div>
  );
}
