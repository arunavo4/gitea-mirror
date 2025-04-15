import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GitHubConfigForm } from './GitHubConfigForm';
import { GiteaConfigForm } from './GiteaConfigForm';
import { ScheduleConfigForm } from './ScheduleConfigForm';

interface ConfigTabsProps {
  githubConfig: any;
  giteaConfig: any;
  scheduleConfig: any;
  onSaveGitHub: (values: any) => void;
  onSaveGitea: (values: any) => void;
  onSaveSchedule: (values: any) => void;
}

export function ConfigTabs({
  githubConfig,
  giteaConfig,
  scheduleConfig,
  onSaveGitHub,
  onSaveGitea,
  onSaveSchedule,
}: ConfigTabsProps) {
  return (
    <Tabs defaultValue="github" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="github">GitHub</TabsTrigger>
        <TabsTrigger value="gitea">Gitea</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
      </TabsList>
      <TabsContent value="github">
        <GitHubConfigForm
          initialValues={githubConfig}
          onSave={onSaveGitHub}
        />
      </TabsContent>
      <TabsContent value="gitea">
        <GiteaConfigForm
          initialValues={giteaConfig}
          onSave={onSaveGitea}
        />
      </TabsContent>
      <TabsContent value="schedule">
        <ScheduleConfigForm
          initialValues={scheduleConfig}
          onSave={onSaveSchedule}
        />
      </TabsContent>
    </Tabs>
  );
}
