import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort } from '../../utils/dateHelpers';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader2, Plus, Building, Save, Trash2 } from 'lucide-react';

export default function AssetManager() {
  const { isAdmin, settings } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Access check
  if (!isAdmin && settings?.user_view_assets !== 'true') {
    return <Navigate to="/dashboard" replace />;
  }

  // Form State
  const [name, setName] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [depreciationRate, setDepreciationRate] = useState('10');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assets');
      setAssets(res.data.assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/assets', {
        name, 
        purchaseValue: parseFloat(purchaseValue), 
        purchaseDate, 
        depreciationRate: parseFloat(depreciationRate || 0), 
        note
      });
      setShowForm(false);
      setName(''); setPurchaseValue(''); setNote(''); setDepreciationRate('10');
      fetchAssets();
    } catch (error) {
      console.error('Error creating asset:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispose = async (id, assetName) => {
    const disposalValue = prompt(`'${assetName}' এর বর্তমান বিক্রয়মূল্য (Disposal Value) লিখুন:`, "0");
    if (disposalValue === null) return;
    
    try {
      await api.put(`/assets/${id}`, {
        isDisposed: true,
        disposalDate: new Date().toISOString(),
        disposalValue: parseFloat(disposalValue || 0)
      });
      fetchAssets();
    } catch (error) {
      console.error('Error disposing asset:', error);
      alert('সম্পদ ডিসপোজ করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">স্থায়ী সম্পদ (Fixed Assets)</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">ফান্ডের যাবতীয় স্থায়ী সম্পদের হিসাব</p>
        </div>
        {isAdmin && (
          <Button icon={Plus} variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'বাতিল করুন' : 'নতুন সম্পদ যোগ করুন'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-l-4 border-l-primary animate-slide-in">
          <CardHeader>
            <CardTitle>নতুন সম্পদ</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="সম্পদের নাম/বিবরণ" required value={name} onChange={e => setName(e.target.value)} />
                <Input label="ক্রয়মূল্য (৳)" type="number" required value={purchaseValue} onChange={e => setPurchaseValue(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="ক্রয়ের তারিখ" type="date" required value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                <Input label="অবচয় হার / Depreciation Rate (%)" type="number" step="0.1" value={depreciationRate} onChange={e => setDepreciationRate(e.target.value)} />
              </div>
              <Input label="নোট (ঐচ্ছিক)" value={note} onChange={e => setNote(e.target.value)} />
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={submitting} icon={Save} variant="primary">সংরক্ষণ করুন</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">তারিখ</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">বিবরণ</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">অবচয় হার</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-right">ক্রয়মূল্য</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-center">স্ট্যাটাস</th>
                {isAdmin && <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-right">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  </td>
                </tr>
              ) : assets.length > 0 ? (
                assets.map((asset) => (
                  <tr key={asset.id} className={`hover:bg-surface-hover transition-colors ${asset.isDisposed ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 text-sm text-text-primary">{formatDateShort(asset.purchaseDate)}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm font-bangla">{asset.name}</p>
                      {asset.note && <p className="text-xs text-text-muted mt-0.5">{asset.note}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{asset.depreciationRate}%</td>
                    <td className="px-6 py-4 text-sm font-bold text-primary text-right">
                      {formatCurrency(asset.purchaseValue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {asset.isDisposed ? (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-semibold">Disposed</span>
                      ) : (
                        <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full font-semibold">Active</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {!asset.isDisposed && (
                          <Button size="sm" variant="outline" onClick={() => handleDispose(asset.id, asset.name)}>
                            বিক্রি/বাদ দিন
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-text-muted font-bangla">
                    কোনো সম্পদের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-border">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            </div>
          ) : assets.length > 0 ? (
            assets.map((asset) => (
              <div key={asset.id} className={`p-4 hover:bg-surface-hover/30 transition-colors flex flex-col gap-2 ${asset.isDisposed ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{formatDateShort(asset.purchaseDate)}</span>
                  {asset.isDisposed ? (
                    <span className="px-2.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded-full font-semibold">Disposed</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-success/20 text-success text-[10px] rounded-full font-semibold">Active</span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm font-bangla text-text-primary">{asset.name}</h4>
                  {asset.note && <p className="text-xs text-text-muted mt-0.5">{asset.note}</p>}
                </div>
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <span className="font-bangla">অবচয় হার: {asset.depreciationRate}%</span>
                  <span className="font-bold text-primary text-sm">{formatCurrency(asset.purchaseValue)}</span>
                </div>
                {isAdmin && !asset.isDisposed && (
                  <div className="flex justify-end pt-1 mt-1 border-t border-border/30">
                    <Button size="sm" variant="outline" onClick={() => handleDispose(asset.id, asset.name)}>
                      বিক্রি/বাদ দিন
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-text-muted font-bangla text-sm">
              কোনো সম্পদের রেকর্ড পাওয়া যায়নি।
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
