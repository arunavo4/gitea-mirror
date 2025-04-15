import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ScheduleConfigFormProps {
  initialValues?: {
    enabled: boolean;
    interval: number;
    lastRun?: Date;
    nextRun?: Date;
  };
  onSave: (values: any) => void;
}

export function ScheduleConfigForm({ initialValues, onSave }: ScheduleConfigFormProps) {
  const [values, setValues] = useState({
    enabled: initialValues?.enabled || false,
    interval: initialValues?.interval || 3600,
    lastRun: initialValues?.lastRun,
    nextRun: initialValues?.nextRun,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setValues({
      ...values,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  // Convert seconds to human-readable format
  const formatInterval = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  };

  // Predefined intervals
  const intervals = [
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
    { value: 7200, label: '2 hours' },
    { value: 14400, label: '4 hours' },
    { value: 28800, label: '8 hours' },
    { value: 43200, label: '12 hours' },
    { value: 86400, label: '1 day' },
    { value: 172800, label: '2 days' },
    { value: 604800, label: '1 week' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="enabled"
                name="enabled"
                type="checkbox"
                checked={values.enabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm font-medium">
                Enable Automatic Mirroring
              </label>
            </div>

            <div>
              <label htmlFor="interval" className="block text-sm font-medium mb-1">
                Mirroring Interval
              </label>
              <select
                id="interval"
                name="interval"
                value={values.interval}
                onChange={handleChange}
                disabled={!values.enabled}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              >
                {intervals.map((interval) => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                How often the mirroring process should run.
              </p>
            </div>

            {values.lastRun && (
              <div>
                <label className="block text-sm font-medium mb-1">Last Run</label>
                <div className="text-sm">
                  {values.lastRun.toLocaleString()}
                </div>
              </div>
            )}

            {values.nextRun && values.enabled && (
              <div>
                <label className="block text-sm font-medium mb-1">Next Run</label>
                <div className="text-sm">
                  {values.nextRun.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save Schedule</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
