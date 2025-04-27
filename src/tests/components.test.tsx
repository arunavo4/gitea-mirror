// import React from 'react';
// import { render, screen, fireEvent } from '@testing-library/react';
// import { describe, it, expect, vi } from 'vitest';
// import { StatusCard } from '../components/dashboard/StatusCard';
// import { RecentActivity } from '../components/dashboard/RecentActivity';
// import { RepositoryList } from '../components/dashboard/RepositoryList';

// describe('StatusCard', () => {
//   it('renders correctly with all props', () => {
//     render(
//       <StatusCard
//         title="Test Title"
//         value="42"
//         icon={<span data-testid="test-icon">Icon</span>}
//         description="Test Description"
//         trend={{ value: 10, isPositive: true }}
//       />
//     );

//     expect(screen.getByText('Test Title')).toBeInTheDocument();
//     expect(screen.getByText('42')).toBeInTheDocument();
//     expect(screen.getByTestId('test-icon')).toBeInTheDocument();
//     expect(screen.getByText('Test Description')).toBeInTheDocument();
//     expect(screen.getByText('+10%')).toBeInTheDocument();
//   });

//   it('renders without trend', () => {
//     render(
//       <StatusCard
//         title="Test Title"
//         value="42"
//         icon={<span>Icon</span>}
//         description="Test Description"
//       />
//     );

//     expect(screen.getByText('Test Title')).toBeInTheDocument();
//     expect(screen.getByText('42')).toBeInTheDocument();
//     expect(screen.getByText('Test Description')).toBeInTheDocument();
//     expect(screen.queryByText('+10%')).not.toBeInTheDocument();
//   });
// });

// describe('RecentActivity', () => {
//   const mockActivities = [
//     {
//       id: '1',
//       message: 'Test Activity 1',
//       timestamp: new Date('2023-01-01'),
//       status: 'success',
//     },
//     {
//       id: '2',
//       message: 'Test Activity 2',
//       timestamp: new Date('2023-01-02'),
//       status: 'error',
//     },
//   ];

//   it('renders activities correctly', () => {
//     render(<RecentActivity activities={mockActivities} />);

//     expect(screen.getByText('Recent Activity')).toBeInTheDocument();
//     expect(screen.getByText('Test Activity 1')).toBeInTheDocument();
//     expect(screen.getByText('Test Activity 2')).toBeInTheDocument();
//   });

//   it('renders empty state when no activities', () => {
//     render(<RecentActivity activities={[]} />);

//     expect(screen.getByText('Recent Activity')).toBeInTheDocument();
//     expect(screen.getByText('No recent activity')).toBeInTheDocument();
//   });
// });

// describe('RepositoryList', () => {
//   const mockRepositories = [
//     {
//       id: '1',
//       name: 'test-repo',
//       fullName: 'user/test-repo',
//       url: 'https://github.com/user/test-repo',
//       isPrivate: false,
//       isFork: false,
//       owner: 'user',
//       organization: null,
//       hasIssues: true,
//       isStarred: false,
//       status: 'mirrored',
//       lastMirrored: new Date('2023-01-01'),
//       configId: '1',
//       createdAt: new Date('2023-01-01'),
//       updatedAt: new Date('2023-01-01'),
//     },
//   ];

//   it('renders repositories correctly', () => {
//     const mockMirrorNow = vi.fn();
//     render(
//       <RepositoryList repositories={mockRepositories} onMirrorNow={mockMirrorNow} />
//     );

//     expect(screen.getByText('Repositories')).toBeInTheDocument();
//     expect(screen.getByText('test-repo')).toBeInTheDocument();
//     // The fullName is not displayed directly in the UI
//     expect(screen.getByText('user')).toBeInTheDocument();
//   });

//   it('calls onMirrorNow when mirror button is clicked', () => {
//     const mockMirrorNow = vi.fn();
//     render(
//       <RepositoryList repositories={mockRepositories} onMirrorNow={mockMirrorNow} />
//     );

//     // Find the mirror button by its SVG icon and click it
//     const buttons = screen.getAllByRole('button');
//     // Just click the first button since we know it's the mirror button in our test
//     fireEvent.click(buttons[0]);
//     expect(mockMirrorNow).toHaveBeenCalledWith('1');
//   });

//   it('renders empty state when no repositories', () => {
//     const mockMirrorNow = vi.fn();
//     render(
//       <RepositoryList repositories={[]} onMirrorNow={mockMirrorNow} />
//     );

//     expect(screen.getByText('Repositories')).toBeInTheDocument();
//     expect(screen.getByText('No repositories found')).toBeInTheDocument();
//   });
// });
