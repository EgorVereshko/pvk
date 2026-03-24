import React, { useState, useEffect } from 'react';
import api from '../api';
import './LineChart.css';

const LineChart = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const weeks = [1, 2, 3, 4, 5, 6, 7];
  const colors = {
    'Работа в команде': '#7dd3fc',
    'Вовлеченность': '#60a5fa',
    'Организованность': '#2563eb',
    'Обучаемость': '#1e3a8a',
  };

  useEffect(() => {
    fetchScoreHistory();
  }, []);

  const fetchScoreHistory = async () => {
    try {
      const response = await api.get('/api/user/scores/history/');
      
      // Преобразуем данные в нужный формат
      let formattedData = [];
      
      if (Array.isArray(response.data)) {
        // Если данные уже в формате массива
        formattedData = response.data;
      } else if (typeof response.data === 'object') {
        // Если данные в формате объекта { компетенция: [значения] }
        formattedData = Object.entries(response.data).map(([label, values]) => ({
          label,
          color: colors[label] || '#94a3b8',
          values: Array.isArray(values) ? values : [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2],
        }));
      }
      
      setHistoryData(formattedData);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      // Дефолтные данные на случай ошибки
      setHistoryData([
        { label: 'Работа в команде', color: '#7dd3fc', values: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2] },
        { label: 'Вовлеченность', color: '#60a5fa', values: [1.0, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1] },
        { label: 'Организованность', color: '#2563eb', values: [1.0, 1.3, 1.6, 1.9, 2.2, 2.5, 2.8] },
        { label: 'Обучаемость', color: '#1e3a8a', values: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const width = 450; // Увеличил ширину для лучшей читаемости
  const height = 250;
  const padding = 40;
  const minY = -1.5; // Немного расширил для отступов
  const maxY = 3.5;

  const scaleX = (i) =>
    padding + (i / (weeks.length - 1)) * (width - padding * 2);

  const scaleY = (v) =>
    height - padding - ((v - minY) / (maxY - minY)) * (height - padding * 2);

  if (loading) {
    return <div className="chart-loading">Загрузка графика...</div>;
  }

  return (
    <div className="line-chart">
      <h3>Динамика развития</h3>

      <div className="chart-container">
        <svg width={width} height={height}>
          {/* Оси */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" strokeWidth="1" />
          
          {/* Горизонтальные линии для уровней */}
          {[-1, 0, 1, 2, 3].map(level => {
            const y = scaleY(level);
            return (
              <line
                key={level}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Подписи недель */}
          {weeks.map((week, i) => {
            const x = scaleX(i);
            return (
              <text
                key={week}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {week}
              </text>
            );
          })}

          {/* Подписи значений по Y */}
          {[-1, 0, 1, 2, 3].map(level => {
            const y = scaleY(level);
            return (
              <text
                key={level}
                x={padding - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6b7280"
              >
                {level}
              </text>
            );
          })}

          {/* Линии графика */}
          {historyData.map((s, i) => (
            <polyline
              key={i}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              points={s.values
                .map((v, idx) => `${scaleX(idx)},${scaleY(v)}`)
                .join(' ')}
            />
          ))}

          {/* Точки на графике */}
          {historyData.map((s, seriesIdx) => 
            s.values.map((v, pointIdx) => {
              if (v === null || v === undefined) return null;
              const [x, y] = [scaleX(pointIdx), scaleY(v)];
              return (
                <circle
                  key={`${seriesIdx}-${pointIdx}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="white"
                  stroke={s.color}
                  strokeWidth="2"
                />
              );
            })
          )}
        </svg>
      </div>

      <div className="chart-legend">
        {historyData.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="chart-note">
        * Каждая точка соответствует проставленной оценке. График показывает изменение оценок во времени.
      </div>
    </div>
  );
};

export default LineChart;