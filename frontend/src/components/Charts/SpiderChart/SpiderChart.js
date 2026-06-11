import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LabelList } from 'recharts';
import api from '../../../api';
import './SpiderChart.scss';

const SpiderChart = ({ userId, userScores = {} }) => {
  const [historicalSpiderData, setHistoricalSpiderData] = useState([]);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const minValue = -1;
  const maxValue = 3;

  useEffect(() => {
    if (userId) {
      fetchHistoricalSpiderData();
    }
  }, [userId]);

  const fetchHistoricalSpiderData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/qualities_stats/${userId}/`);
      
      if (response.data && Array.isArray(response.data)) {
        let maxPeriods = 0;
        response.data.forEach(quality => {
          if (quality.scores && quality.scores.length > maxPeriods) {
            maxPeriods = quality.scores.length;
          }
        });
        
        const charts = [];
        for (let period = 0; period < maxPeriods; period++) {
          const periodScores = {};
          let hasValidScores = false;
          
          response.data.forEach(quality => {
            if (quality.scores && quality.scores[period] !== undefined && quality.scores[period] !== null) {
              periodScores[quality.quality_name] = quality.scores[period];
              hasValidScores = true;
            }
          });
          
          if (hasValidScores) {
            charts.push({
              period: period + 1,
              scores: periodScores,
              totalScores: Object.values(periodScores).length
            });
          }
        }
        
        setHistoricalSpiderData(charts);
        if (charts.length > 0) {
          setCurrentPeriodIndex(charts.length - 1);
        } else {
          setCurrentPeriodIndex(-1);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки исторических данных для диаграмм:', err);
      if (err.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, обновите страницу.');
      } else {
        setError('Не удалось загрузить историю диаграмм');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentChartData = () => {
    if (currentPeriodIndex >= 0 && historicalSpiderData[currentPeriodIndex]) {
      const currentScores = historicalSpiderData[currentPeriodIndex].scores;
      return [
        { subject: 'Организованность', value: currentScores['Организованность'] ?? 1.0, fullMark: 3 },
        { subject: 'Вовлеченность', value: currentScores['Вовлеченность'] ?? 1.0, fullMark: 3 },
        { subject: 'Работа в команде', value: currentScores['Работа в команде'] ?? 1.0, fullMark: 3 },
        { subject: 'Обучаемость', value: currentScores['Обучаемость'] ?? 1.0, fullMark: 3 },
      ];
    }
    
    return [
      { subject: 'Организованность', value: userScores['Организованность'] ?? 1.0, fullMark: 3 },
      { subject: 'Вовлеченность', value: userScores['Вовлеченность'] ?? 1.0, fullMark: 3 },
      { subject: 'Работа в команде', value: userScores['Работа в команде'] ?? 1.0, fullMark: 3 },
      { subject: 'Обучаемость', value: userScores['Обучаемость'] ?? 1.0, fullMark: 3 },
    ];
  };

  const handlePrevious = () => {
    if (currentPeriodIndex > 0) {
      setCurrentPeriodIndex(currentPeriodIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentPeriodIndex < historicalSpiderData.length - 1) {
      setCurrentPeriodIndex(currentPeriodIndex + 1);
    }
  };

  const getAverageScore = () => {
    const data = getCurrentChartData();
    const scores = data.map(item => item.value);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg * 10) / 10;
  };

  if (loading) {
    return (
      <div className="spider-chart">
        <h3>Диаграмма качеств</h3>
        <div className="chart-loading">Загрузка диаграмм...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spider-chart">
        <h3>Диаграмма качеств</h3>
        <div className="chart-error">{error}</div>
        <button className="retry-button" onClick={fetchHistoricalSpiderData}>
          Повторить попытку
        </button>
      </div>
    );
  }

  const chartData = getCurrentChartData();
  const hasHistoricalData = historicalSpiderData.length > 0;

  return (
    <div className="spider-chart">
      <div className="spider-header">
        <h3>Диаграмма качеств</h3>
        {hasHistoricalData && (
          <div className="period-info">
            <span className="period-label">
              Оценка {historicalSpiderData[currentPeriodIndex]?.period || 1} из {historicalSpiderData.length}
            </span>
            <span className="average-score-badge">
              Средний балл: {getAverageScore().toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="spider-chart-container">
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData} margin={{ top: 40, right: 60, bottom: 40, left: 60 }}>
            <PolarGrid />
            
            <PolarAngleAxis dataKey="subject" />
            
            <PolarRadiusAxis 
              angle={30} 
              domain={[minValue, maxValue]} 
              tickCount={5}
              tickFormatter={(value) => value.toFixed(0)}
            />
            
            <Radar
              name="Оценки"
              dataKey="value"
              stroke="#4a90e2"
              fill="#4a90e2"
              fillOpacity={0.3}
            >
              <LabelList
                dataKey="value"
                position="outside"
                formatter={(value) => value.toFixed(1)}
                style={{
                  fill: '#0f172a',
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
            </Radar>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="spider-navigation-bottom">
        <div className="navigation-buttons">
          <button 
            className="nav-button nav-prev"
            onClick={handlePrevious}
            disabled={!hasHistoricalData || currentPeriodIndex <= 0}
            title="Предыдущая диаграмма"
          >
            ←
          </button>
          
          <span className="nav-counter">
            {hasHistoricalData ? (
              <>
                <span className="current">{currentPeriodIndex + 1}</span>
                <span className="separator">/</span>
                <span className="total">{historicalSpiderData.length}</span>
              </>
            ) : (
              <span className="no-data">Нет данных</span>
            )}
          </span>
          
          <button 
            className="nav-button nav-next"
            onClick={handleNext}
            disabled={!hasHistoricalData || currentPeriodIndex >= historicalSpiderData.length - 1}
            title="Следующая диаграмма"
          >
            →
          </button>
        </div>

        {hasHistoricalData && historicalSpiderData.length > 1 && (
          <div className="period-dots">
            {historicalSpiderData.map((_, idx) => (
              <button
                key={idx}
                className={`period-dot ${idx === currentPeriodIndex ? 'active' : ''}`}
                onClick={() => setCurrentPeriodIndex(idx)}
                title={`Перейти к диаграмме ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SpiderChart;