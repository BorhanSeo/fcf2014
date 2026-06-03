import { useAuth } from '../../context/AuthContext';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateHelpers';
import { User, Mail, Phone, Calendar, CreditCard } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-bangla-display">প্রোফাইল</h1>
        <p className="text-sm text-text-secondary font-bangla mt-1">আপনার ব্যক্তিগত তথ্যাদি</p>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Cover Photo Area */}
        <div className="h-40 bg-gradient-to-br from-primary via-secondary to-info relative">
          <div className="absolute inset-0 bg-black/10"></div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        </div>
        
        <CardBody className="flex flex-col items-center pt-0 relative pb-8">
          {/* Avatar */}
          <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-xl -mt-16 z-10 relative">
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-primary text-5xl font-bold font-bangla border border-primary/10">
              {user.name.charAt(0)}
            </div>
          </div>
          
          {/* User Info */}
          <div className="text-center mt-4 space-y-2">
            <h2 className="text-3xl font-bold text-text-primary font-bangla-display">{user.name}</h2>
            <p className="text-text-muted flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="active" className="px-4 py-1.5 text-sm shadow-sm border border-success/20">সদস্য (Active)</Badge>
              {user.role === 'SUPER_ADMIN' && <Badge variant="paid" className="px-4 py-1.5 text-sm shadow-sm border border-secondary/20">অ্যাডমিন (Admin)</Badge>}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-surface-alt/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Phone className="w-5 h-5" /> যোগাযোগের তথ্য
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-hover transition-colors">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted font-bangla mb-0.5">ইমেইল অ্যাড্রেস</p>
                <p className="text-text-primary font-bold text-[15px]">{user.email}</p>
              </div>
            </div>
            
            <div className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-hover transition-colors">
              <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted font-bangla mb-0.5">মোবাইল নম্বর</p>
                <p className="text-text-primary font-bold text-[15px]">{user.phone || 'দেওয়া হয়নি'}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-surface-alt/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-secondary">
              <CreditCard className="w-5 h-5" /> সদস্যপদের তথ্য
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-hover transition-colors">
              <div className="w-14 h-14 rounded-full bg-info/10 flex items-center justify-center text-info group-hover:scale-110 group-hover:bg-info group-hover:text-white transition-all duration-300 shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted font-bangla mb-0.5">যোগদানের তারিখ</p>
                <p className="text-text-primary font-bold text-[15px]">{formatDate(user.joinDate)}</p>
              </div>
            </div>
            
            <div className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-hover transition-colors">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center text-success group-hover:scale-110 group-hover:bg-success group-hover:text-white transition-all duration-300 shadow-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted font-bangla mb-0.5">মাসিক চাঁদার পরিমাণ</p>
                <p className="text-2xl text-primary font-bold font-bangla">{formatCurrency(user.monthlyAmount)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
