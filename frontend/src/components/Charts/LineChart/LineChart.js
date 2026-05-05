import React from 'react';
import './LineChart.css';

const LineChart = ({ userScores = {} }) => {
  const weeks = [1, 2, 3, 4, 5, 6, 7];
  const colors = {
    'Работа в команде': '#7dd3fc',
    'Вовлеченность': '#60a5fa',
    'Организованность': '#2563eb',
    'Обучаемость': '#1e3a8a',
  };

  // Получаем текущие оценки из userScores
  const currentScores = {
    'Работа в команде': userScores['Работа в команде'] ?? 1.0,
    'Вовлеченность': userScores['Вовлеченность'] ?? 1.0,
    'Организованность': userScores['Организованность'] ?? 1.0,
    'Обучаемость': userScores['Обучаемость'] ?? 1.0,
  };

  // Генерируем горизонтальные данные (одинаковое значение на всех неделях)
  const generateConstantData = (currentValue) => {
    return weeks.map(() => currentValue);
  };

  const seriesData = [
    {
      label: 'Работа в команде',
      color: colors['Работа в команде'],
      values: generateConstantData(currentScores['Работа в команде']),
    },
    {
      label: 'Вовлеченность',
      color: colors['Вовлеченность'],
      values: generateConstantData(currentScores['Вовлеченность']),
    },
    {
      label: 'Организованность',
      color: colors['Организованность'],
      values: generateConstantData(currentScores['Организованность']),
    },
    {
      label: 'Обучаемость',
      color: colors['Обучаемость'],
      values: generateConstantData(currentScores['Обучаемость']),
    },
  ];

  const width = 450;
  const height = 250;
  const padding = 40;
  const minY = -1.5;
  const maxY = 3.5;

  const scaleX = (i) =>
    padding + (i / (weeks.length - 1)) * (width - padding * 2);

  const scaleY = (v) =>
    height - padding - ((v - minY) / (maxY - minY)) * (height - padding * 2);

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

          {/* Линии графика (горизонтальные) */}
          {seriesData.map((s, i) => (
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
          {seriesData.map((s, seriesIdx) => 
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
        {seriesData.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="chart-note">
        * График показывает текущие оценки по всем неделям
      </div>
    </div>
  );
};

export default LineChart;