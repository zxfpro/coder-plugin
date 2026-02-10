import React, { useEffect, useState } from 'react';
import { getPointsBalance } from '../api/client';

interface PointsBalanceProps {
  onRefresh?: () => void;
}

export default function PointsBalance({ onRefresh }: PointsBalanceProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBalance();
  }, [onRefresh]);

  const fetchBalance = async () => {
    try {
      const res = await getPointsBalance();
      setBalance(res.balance);
    } catch (error) {
      console.error('Failed to fetch points balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.balance}>{balance}</div>
      <div style={styles.label}>积分余额</div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    background: '#f0f8ff',
    borderRadius: '8px',
    border: '1px solid #d0e8ff',
  },
  balance: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0066cc',
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
};