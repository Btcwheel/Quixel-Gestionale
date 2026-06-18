'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const alerts = [
  {
    id: 1,
    severity: 'critical',
    title: 'AI Credits Critical',
    message: 'OpenAI-1 account below 10%',
    time: '5 min ago',
  },
  {
    id: 2,
    severity: 'high',
    title: 'Sync Failed',
    message: 'GitHub repo sync timeout',
    time: '1 hour ago',
  },
  {
    id: 3,
    severity: 'medium',
    title: 'Deployment Warning',
    message: 'Preview deploy failed',
    time: '3 hours ago',
  },
];

interface AlertListProps {
  count: number;
}

export function AlertList({ count }: AlertListProps) {
  if (count === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.slice(0, count).map((alert) => (
        <div
          key={alert.id}
          className="p-3 bg-secondary rounded-lg border border-border hover:border-primary transition-colors"
        >
          <div className="flex items-start space-x-2">
            {alert.severity === 'critical' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            ) : alert.severity === 'high' ? (
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{alert.time}</p>
            </div>
          </div>
        </div>
      ))}
      
      {count > 3 && (
        <button className="w-full text-center text-sm text-primary hover:underline">
          View all {count} alerts
        </button>
      )}
    </div>
  );
}
