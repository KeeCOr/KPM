// frontend/src/components/AddProjectModal.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import AddProjectModal from './AddProjectModal';

test('calls onAdd with name and path on submit', () => {
  const onAdd = vi.fn();
  render(<AddProjectModal onAdd={onAdd} onClose={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText('SquadVsMonster'), {
    target: { value: 'MyProject' },
  });
  fireEvent.change(screen.getByPlaceholderText('C:/Users/.../MyProject'), {
    target: { value: 'C:/test/path' },
  });
  fireEvent.click(screen.getByRole('button', { name: '추가' }));

  expect(onAdd).toHaveBeenCalledWith('MyProject', 'C:/test/path');
});

test('calls onClose when cancel is clicked', () => {
  const onClose = vi.fn();
  render(<AddProjectModal onAdd={vi.fn()} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(onClose).toHaveBeenCalled();
});

test('does not call onAdd when fields are empty', () => {
  const onAdd = vi.fn();
  render(<AddProjectModal onAdd={onAdd} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '추가' }));
  expect(onAdd).not.toHaveBeenCalled();
});
