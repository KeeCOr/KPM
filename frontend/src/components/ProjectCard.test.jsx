// frontend/src/components/ProjectCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from './ProjectCard';

const project = {
  id: '1',
  name: 'SquadVsMonster',
  status: 'active',
  instructions: [
    { id: 'a', text: '보스 패턴 추가', done: false, createdAt: '2026-04-27T14:30:00Z' },
    { id: 'b', text: '사운드 연동', done: true, createdAt: '2026-04-27T10:00:00Z' },
  ],
  progress: 50,
};

test('renders project name', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('SquadVsMonster')).toBeInTheDocument();
});

test('shows instruction count', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText(/총 2건/)).toBeInTheDocument();
});

test('renders instruction texts', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('보스 패턴 추가')).toBeInTheDocument();
  expect(screen.getByText('사운드 연동')).toBeInTheDocument();
});

test('shows progress percentage', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('50%')).toBeInTheDocument();
});

test('calls onUpdate when adding instruction via Enter', () => {
  const onUpdate = vi.fn();
  render(<ProjectCard project={project} onUpdate={onUpdate} onDelete={vi.fn()} onOpen={vi.fn()} />);
  const input = screen.getByPlaceholderText('새 지시사항 추가...');
  fireEvent.change(input, { target: { value: '새 기능' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      instructions: expect.arrayContaining([
        expect.objectContaining({ text: '새 기능', done: false }),
      ]),
    })
  );
});

test('calls onOpen when open button clicked', () => {
  const onOpen = vi.fn();
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={onOpen} />);
  fireEvent.click(screen.getByRole('button', { name: '열기' }));
  expect(onOpen).toHaveBeenCalled();
});

test('shows dash for missing progress', () => {
  const p = { ...project, progress: null };
  render(<ProjectCard project={p} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('plan 파일 없음')).toBeInTheDocument();
});
