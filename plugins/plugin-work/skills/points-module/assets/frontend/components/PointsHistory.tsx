import React, { useEffect, useState } from 'react';
import { getPointsTransactions } from '../api/client';

interface Transaction {
  id: string;
  delta: number;
  reason: string;
  status: string;
  created_at: string;
}

export default function PointsHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await getPointsTransactions();
      setTransactions(res.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>积分记录</h3>

      {transactions.length === 0 ? (
        <div style={styles.emptyState}>暂无积分记录</div>
      ) : (
        <div style={styles.list}>
          {transactions.map((transaction) => (
            <div key={transaction.id} style={styles.item}>
              <div style={styles.itemHeader}>
                <div style={styles.delta}>
                  {transaction.delta > 0 ? '+' : ''}{transaction.delta}
                </div>
                <div style={styles.status}>{transaction.status}</div>
              </div>
              <div style={styles.reason}>{transaction.reason}</div>
              <div style={styles.date}>
                {new Date(transaction.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    maxWidth: '600px',
  },
  title: {
    marginBottom: '16px',
    color: '#333',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  item: {
    padding: '12px',
    background: '#f8f8f8',
    borderRadius: '4px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  delta: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: (props: { delta: number }) => (props.delta > 0 ? '#00cc66' : '#ff6666'),
  },
  status: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: (props: { status: string }) => {
      if (props.status === 'success') return '#d0f0c0';
      if (props.status === 'pending') return '#fff3cd';
      if (props.status === 'failed') return '#ffcccc';
      return '#e0e0e0';
    },
    color: (props: { status: string }) => {
      if (props.status === 'success') return '#008000';
      if (props.status === 'pending') return '#856404';
      if (props.status === 'failed') return '#721c24';
      return '#333';
    },
  },
  reason: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '4px',
  },
  date: {
    fontSize: '12px',
    color: '#999',
  },
};