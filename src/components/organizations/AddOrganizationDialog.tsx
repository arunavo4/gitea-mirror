import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AddOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, type: 'member' | 'public') => void;
}

export function AddOrganizationDialog({ isOpen, onClose, onAdd }: AddOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'member' | 'public'>('public');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }
    
    onAdd(name, type);
    setName('');
    setType('public');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Add Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Organization Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g., microsoft"
                />
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Organization Type</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="type-member"
                      type="radio"
                      name="type"
                      value="member"
                      checked={type === 'member'}
                      onChange={() => setType('member')}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="type-member" className="ml-2 block text-sm">
                      Member Organization (you are a member)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="type-public"
                      type="radio"
                      name="type"
                      value="public"
                      checked={type === 'public'}
                      onChange={() => setType('public')}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="type-public" className="ml-2 block text-sm">
                      Public Organization (anyone can access)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Organization</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
