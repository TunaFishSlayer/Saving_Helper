import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Target } from 'lucide-react';
// Note: You may need to create a goalsService similar to categoryService

const Goals = () => {
  const [goals, setGoals] = useState([]);
  
  // Dummy data for visual representation initially
  useEffect(() => {
    setGoals([
      { id: '1', name: 'Emergency Fund', targetAmount: 5000, currentAmount: 2500, deadline: '2027-01-01' },
      { id: '2', name: 'Vacation', targetAmount: 1500, currentAmount: 300, deadline: '2026-08-01' }
    ]);
  }, []);

  return (
    <div className="goals-page" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={28} color="#FFC107" /> Savings Goals
        </h1>
        <button className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Add Goal
        </button>
      </div>

      <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="goal-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>{goal.name}</h3>
                <Target size={20} color="#666" />
              </div>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                <span>${goal.currentAmount} saved</span>
                <span>Goal: ${goal.targetAmount}</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? '#4CAF50' : '#3B82F6', transition: 'width 0.5s ease' }}></div>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#888' }}>
                Target Date: {new Date(goal.deadline).toLocaleDateString()}
              </div>
              <button className="button button-secondary" style={{ width: '100%', marginTop: '16px', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>
                Add Funds
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Goals;
