import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api';

export default function SettingsModal({ onClose }) {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(s => setRules(s.globalRules || []))
      .finally(() => setLoading(false));
  }, []);

  function addRule() {
    if (!newRule.trim()) return;
    setRules(prev => [...prev, newRule.trim()]);
    setNewRule('');
  }

  function deleteRule(i) {
    setRules(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({ globalRules: rules });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-wide">
        <h2>공용 규칙 설정</h2>
        <p className="settings-desc">모든 프로젝트에 적용할 공통 지시사항입니다.</p>
        {loading ? (
          <p className="scan-status">로딩 중...</p>
        ) : (
          <>
            <ul className="rules-list">
              {rules.length === 0 && (
                <li className="rules-empty">아직 규칙이 없습니다.</li>
              )}
              {rules.map((r, i) => (
                <li key={i} className="rule-item">
                  <span>{r}</span>
                  <button onClick={() => deleteRule(i)} className="danger-icon">✕</button>
                </li>
              ))}
            </ul>
            <div className="add-instruction">
              <input
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && addRule()}
                placeholder="새 규칙 입력 후 Enter..."
              />
              <button onClick={addRule}>+</button>
            </div>
          </>
        )}
        <div className="modal-actions">
          <button onClick={onClose} disabled={saving}>취소</button>
          <button onClick={handleSave} disabled={saving || loading}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
