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

  // Генерируем динамические данные (постепенный рост/изменение по неделям)
  const generateDynamicData = (endValue) => {
    const startValue = Math.max(-1, endValue - 1.2);
    return weeks.map((_, i) => {
      const progress = i / (weeks.length - 1);
      let value = startValue + (endValue - startValue) * progress;
      // Добавляем небольшие колебания для реалистичности
      if (i > 0 && i < weeks.length - 1) {
        const variation = (Math.random() - 0.5) * 0.3;
        value = Math.min(3, Math.max(-1, value + variation));
      }
      return Math.round(value * 10) / 10;
    });
  };

  const seriesData = [
    {
      label: 'Работа в команде',
      color: colors['Работа в команде'],
      values: generateDynamicData(currentScores['Работа в команде']),
    },
    {
      label: 'Вовлеченность',
      color: colors['Вовлеченность'],
      values: generateDynamicData(currentScores['Вовлеченность']),
    },
    {
      label: 'Организованность',
      color: colors['Организованность'],
      values: generateDynamicData(currentScores['Организованность']),
    },
    {
      label: 'Обучаемость',
      color: colors['Обучаемость'],
      values: generateDynamicData(currentScores['Обучаемость']),
    },
  ];

  const width = 500;
  const height = 300;
  const padding = 50;
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
          
          {/* Стрелка оси Y */}
          <polygon points={`${padding - 4},${padding} ${padding},${padding - 6} ${padding + 4},${padding}`} fill="#ccc" />
          
          {/* Стрелка оси X */}
          <polygon points={`${width - padding},${height - padding + 4} ${width - padding + 6},${height - padding} ${width - padding},${height - padding - 4}`} fill="#ccc" />
          
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

          {/* Подписи недель по оси X */}
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

          {/* Подписи значений по оси Y */}
          {[-1, 0, 1, 2, 3].map(level => {
            const y = scaleY(level);
            return (
              <text
                key={level}
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6b7280"
              >
                {level}
              </text>
            );
          })}

          {/* Подпись оси X (горизонтально) */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="12"
            fill="#475569"
            fontWeight="500"
          >
            Неделя
          </text>

          {/* Подпись оси Y (вертикально) */}
          <text
            x={-height / 2}
            y={15}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="12"
            fill="#475569"
            fontWeight="500"
          >
            Балл
          </text>

          {/* Линии графика */}
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
                  strokeWidth="2.5"
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
        * График показывает динамику развития по всем неделям
      </div>
    </div>
  );
};

export default LineChart;