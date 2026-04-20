import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SalonesManager } from '@/components/host/SalonesManager';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function HostSalones() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/host')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
        <SalonesManager />
      </div>
    </DashboardLayout>
  );
}
