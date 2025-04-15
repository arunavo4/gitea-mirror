import { ToastProvider as UIToastProvider } from '@/components/ui/toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <UIToastProvider>{children}</UIToastProvider>;
}
