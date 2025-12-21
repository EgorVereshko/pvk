import React from 'react';
import './LineChart.css';

const LineChart = () => {
  const weeks = [1, 2, 3, 4, 5, 6, 7];

  const series = [
    {
      label: 'Работа в команде',
      color: '#7dd3fc',
      values: [0.3, 0.4, 0.5, 0.6, 0.5, 0.6, 0.8],
    },
    {
      label: 'Вовлеченность',
      color: '#60a5fa',
      values: [-0.5, -0.4, -0.2, 0, -0.3, 0, 0.4],
    },
    {
      label: 'Организованность',
      color: '#2563eb',
      values: [1.8, 1.9, 2.0, 2.2, 2.1, 2.3, 2.6],
    },
    {
      label: 'Обучаемость',
      color: '#1e3a8a',
      values: [1.1, 1.2, 1.3, 1.5, 1.4, 1.6, 1.9],
    },
  ];

  const width = 420;
  const height = 220;
  const padding = 30;
  const minY = -1;
  const maxY = 3;

  const scaleX = (i) =>
    padding + (i / (weeks.length - 1)) * (width - padding * 2);

  const scaleY = (v) =>
    height - padding - ((v - minY) / (maxY - minY)) * (height - padding * 2);

  return (
    <div className="line-chart">
      <h3>Аналитика за 11.11 – 11.12</h3>

      <svg width={width} height={height}>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />

        {series.map((s, i) => (
          <polyline
            key={i}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            points={s.values
              .map((v, idx) => `${scaleX(idx)},${scaleY(v)}`)
              .join(' ')}
          />
        ))}
      </svg>

      <div className="chart-legend">
        {series.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
