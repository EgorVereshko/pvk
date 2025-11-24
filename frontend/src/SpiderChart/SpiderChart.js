import React from 'react';
import './SpiderChart.css';

const SpiderChart = () => {
  const data = [
    { label: 'Коммуникация', value: 4 },
    { label: 'Работа с критикой/обратной связью', value: 1 },
    { label: 'Командная работа', value: 3 },
    { label: 'Самоорганизация и планирование', value: 1 },
    { label: 'Обучаемость', value: 4 },
    { label: 'Инициативность и ответственность', value: 1 }
  ];

  const size = 350; // Размер для сетки оценок
  const center = size / 2;
  const radius = size / 2 - 60;
  const angles = data.map((_, i) => (i * 2 * Math.PI) / data.length);
  const levels = 5;

  // Функция для разбивки текста на несколько строк
  const splitTextIntoLines = (text, maxLineLength = 15) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + ' ' + word).length <= maxLineLength) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Функция для создания точек полигона для конкретного уровня
  const createLevelPoints = (level) => {
    const levelRadius = (level / levels) * radius;
    return angles.map(angle => {
      const x = center + levelRadius * Math.sin(angle);
      const y = center - levelRadius * Math.cos(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Создаем точки для полигона данных (преобразуем 1-5 в радиус)
  const dataPoints = data.map((item, i) => {
    const angle = angles[i];
    const valueRadius = (item.value / levels) * radius;
    const x = center + valueRadius * Math.sin(angle);
    const y = center - valueRadius * Math.cos(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="spider-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Сетка уровней (5 концентрических многоугольников) */}
        {[...Array(levels)].map((_, level) => (
          <g key={level}>
            <polygon
              points={createLevelPoints(level + 1)}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="1"
              strokeDasharray={level === levels - 1 ? "none" : "2,2"} // Внешний сплошной, внутренние пунктир
            />
            {/* Подписи уровней (1-5) */}
            <text
              x={center - 25}
              y={center - ((level + 1) / levels) * radius + 15}
              textAnchor="middle"
              dominantBaseline="middle"
              className="level-label"
            >
              {level + 1}
            </text>
          </g>
        ))}
        
        {/* Линии осей */}
        {angles.map((angle, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.sin(angle)}
            y2={center - radius * Math.cos(angle)}
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}
        
        {/* Данные - основной полигон */}
        <polygon
          points={dataPoints}
          fill="rgba(74, 144, 226, 0.3)"
          stroke="#4a90e2"
          strokeWidth="2"
        />
        
        {/* Точки данных */}
        {dataPoints.split(' ').map((point, i) => {
          const [x, y] = point.split(',').map(Number);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#4a90e2"
            />
          );
        })}
        
        {/* Подписи в несколько строк */}
        {angles.map((angle, i) => {
          const labelRadius = radius + 25; // Расстояние для подписей
          const x = center + labelRadius * Math.sin(angle);
          const y = center - labelRadius * Math.cos(angle);
          const lines = splitTextIntoLines(data[i].label, 12);
          
          return (
            <g key={i} className="spider-label-group">
              {lines.map((line, lineIndex) => (
                <text
                  key={lineIndex}
                  x={x}
                  y={y + lineIndex * 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="spider-label"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Легенда с объяснением шкалы */}
      {/* <div className="scale-legend">
        <h4>5-бальная шкала оценок:</h4>
        <div className="scale-items">
          <div className="scale-item">1 - Начальный уровень</div>
          <div className="scale-item">2 - Базовый уровень</div>
          <div className="scale-item">3 - Средний уровень</div>
          <div className="scale-item">4 - Продвинутый уровень</div>
          <div className="scale-item">5 - Экспертный уровень</div>
        </div>
      </div> */}
    </div>
  );
};

export default SpiderChart;