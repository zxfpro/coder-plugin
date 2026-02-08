import React, { useState, useEffect } from 'react';
import { getRechargePlans, rechargePoints } from '../api/client';

interface PointsRechargeProps {
  onSuccess?: () => void;
}

interface RechargePlan {
  id: number;
  name: string;
  price_cny: number;
  points: number;
}

export default function PointsRecharge({ onSuccess }: PointsRechargeProps) {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('wechat');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingPlans, setFetchingPlans] = useState<boolean>(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await getRechargePlans();
      setPlans(res.plans);
      if (res.plans.length > 0) {
        setSelectedPlan(res.plans[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch recharge plans:', error);
    } finally {
      setFetchingPlans(false);
    }
  };

  const handleRecharge = async () => {
    setLoading(true);
    try {
      await rechargePoints({
        plan_id: selectedPlan,
        payment_method: paymentMethod,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to recharge points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPlans) {
    return <div style={styles.container}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>积分充值</h3>

      <div style={styles.formGroup}>
        <label style={styles.label}>充值套餐:</label>
        <select
          style={styles.select}
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(parseInt(e.target.value))}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - ¥{plan.price_cny} ({plan.points}积分)
            </option>
          ))}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>支付方式:</label>
        <select
          style={styles.select}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="wechat">微信支付</option>
          <option value="alipay">支付宝</option>
          <option value="card">银行卡支付</option>
        </select>
      </div>

      <button
        style={styles.button}
        onClick={handleRecharge}
        disabled={loading}
      >
        {loading ? '充值中...' : '充值'}
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
    backgroundColor: '#00cc66',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};