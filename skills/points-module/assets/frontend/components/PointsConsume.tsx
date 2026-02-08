import React, { useState } from 'react';
import { consumePoints } from '../api/client';

interface PointsConsumeProps {
  onSuccess?: () => void;
}

export default function PointsConsume({ onSuccess }: PointsConsumeProps) {
  const [action, setAction] = useState<string>('generate_image');
  const [size, setSize] = useState<string>('512x512');
  const [feature, setFeature] = useState<string>('base');
  const [loading, setLoading] = useState<boolean>(false);

  const handleConsume = async () => {
    setLoading(true);
    try {
      await consumePoints({
        action,
        size,
        feature,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to consume points:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>积分消费</h3>

      <div style={styles.formGroup}>
        <label style={styles.label}>操作类型:</label>
        <select
          style={styles.select}
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="generate_image">生成图片</option>
          <option value="remove_bg">去除背景</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>尺寸:</label>
        <select
          style={styles.select}
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="512x512">512x512</option>
          <option value="1024x1024">1024x1024</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>功能:</label>
        <select
          style={styles.select}
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
        >
          <option value="base">基础</option>
          <option value="hd">高清</option>
        </select>
      </div>

      <button
        style={styles.button}
        onClick={handleConsume}
        disabled={loading}
      >
        {loading ? '消费中...' : '消费积分'}
      </button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    maxWidth: '400px',
  },
  title: {
    marginBottom: '16px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12px',
    color: '#666',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};