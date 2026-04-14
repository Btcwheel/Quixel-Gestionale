'use client';

import { MessageSquare, GitBranch, Rocket } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'chat',
    message: 'AI chat completed on E-commerce Platform',
    time: '2 minutes ago',
    icon: MessageSquare,
  },
  {
    id: 2,
    type: 'push',
    message: 'GitHub push to acme-corp/api-backend',
    time: '15 minutes ago',
    icon: GitBranch,
  },
  {
    id: 3,
    type: 'deploy',
    message: 'Vercel deployment successful for marketing-site',
    time: '1 hour ago',
    icon: Rocket,
  },
  {
    id: 4,
    type: 'chat',
    message: 'New conversation on Mobile App project',
    time: '2 hours ago',
    icon: MessageSquare,
  },
];

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-border last:border-0">
          <div className="p-2 bg-secondary rounded-lg">
            <activity.icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{activity.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
