import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "../ui/checkbox";
import type { ScheduleConfig } from "@/types/config";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ScheduleConfigFormProps {
  config: ScheduleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScheduleConfig>>;
}

export function ScheduleConfigForm({
  config,
  setConfig,
}: ScheduleConfigFormProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setConfig({
      ...config,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // Convert seconds to human-readable format
  const formatInterval = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  };

  // Predefined intervals
  const intervals: { value: number; label: string }[] = [
    // { value: 120, label: "2 minutes" }, //for testing
    { value: 900, label: "15 minutes" },
    { value: 1800, label: "30 minutes" },
    { value: 3600, label: "1 hour" },
    { value: 7200, label: "2 hours" },
    { value: 14400, label: "4 hours" },
    { value: 28800, label: "8 hours" },
    { value: 43200, label: "12 hours" },
    { value: 86400, label: "1 day" },
    { value: 172800, label: "2 days" },
    { value: 604800, label: "1 week" },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center">
            <Checkbox
              id="enabled"
              name="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) =>
                handleChange({
                  target: {
                    name: "enabled",
                    type: "checkbox",
                    checked: Boolean(checked),
                    value: "",
                  },
                } as React.ChangeEvent<HTMLInputElement>)
              }
            />
            <label
              htmlFor="enabled"
              className="select-none ml-2 block text-sm font-medium"
            >
              Enable Automatic Mirroring
            </label>
          </div>

          <div>
            <label
              htmlFor="interval"
              className="block text-sm font-medium mb-1.5"
            >
              Mirroring Interval
            </label>

            <Select
              name="interval"
              value={String(config.interval)}
              onValueChange={(value) =>
                handleChange({
                  target: { name: "interval", value },
                } as React.ChangeEvent<HTMLInputElement>)
              }
            >
              <SelectTrigger className="w-full border border-input dark:bg-background dark:hover:bg-background">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground border border-input shadow-sm">
                {intervals.map((interval) => (
                  <SelectItem
                    key={interval.value}
                    value={interval.value.toString()}
                    className="cursor-pointer text-sm px-3 py-2 hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                  >
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground mt-1">
              How often the mirroring process should run.
            </p>
          </div>

          {config.lastRun && (
            <div>
              <label className="block text-sm font-medium mb-1">Last Run</label>
              <div className="text-sm">{formatDate(config.lastRun)}</div>
            </div>
          )}

          {config.nextRun && config.enabled && (
            <div>
              <label className="block text-sm font-medium mb-1">Next Run</label>
              <div className="text-sm">{formatDate(config.nextRun)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
