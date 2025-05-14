import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ActivityNameComboboxProps = {
  activities: any[];
  value: string;
  onChange: (value: string) => void;
};

export function ActivityNameCombobox({ activities, value, onChange }: ActivityNameComboboxProps) {
  // Collect unique names from repositoryName and organizationName
  const names = React.useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.repositoryName) set.add(a.repositoryName);
      if (a.organizationName) set.add(a.organizationName);
    });
    return Array.from(set).sort();
  }, [activities]);

  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between"
        >
          {value ? value : "All Names"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search name..." />
          <CommandList>
            <CommandEmpty>No name found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                key="all"
                value=""
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                All Names
              </CommandItem>
              {names.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === name ? "opacity-100" : "opacity-0")} />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
