import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api';
import './LineChart.scss';

const LineChart = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: null, label: null });

  const colors = {
    'Работа в команде': '#7dd3fc',
    'Вовлеченность': '#60a5fa',
    'Организованность': '#2563eb',
    'Обучаемость': '#1e3a8a',
  };

  useEffect(() => {
    const fetchHistoricalScores = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/qualities_stats/${userId}/`);
        
        if (response.data && Array.isArray(response.data)) {
          const dataMap = {};
          response.data.forEach(quality => {
            dataMap[quality.quality_name] = quality.scores;
          });
          setHistoricalData(dataMap);
        }
      } catch (err) {
        console.error('Ошибка загрузки исторических данных:', err);
        setError('Не удалось загрузить динамику оценок');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalScores();
  }, [userId]);

  const getPeriods = useMemo(() => {
    let maxLength = 0;
    Object.values(historicalData).forEach(scores => {
      if (scores && scores.length > maxLength) {
        maxLength = scores.length;
      }
    });
    
    return Array.from({ length: maxLength }, (_, i) => i + 1);
  }, [historicalData]);

  const seriesData = useMemo(() => {
    const qualities = ['Работа в команде', 'Вовлеченность', 'Организованность', 'Обучаемость'];
    
    return qualities.map(quality => ({
      label: quality,
      color: colors[quality],
      values: historicalData[quality] || []
    })).filter(series => series.values.length > 0);
  }, [historicalData, colors]);

  if (loading) {
    return (
      <div className="line-chart">
        <h3>Динамика развития</h3>
        <div className="chart-loading">Загрузка данных...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="line-chart">
        <h3>Динамика развития</h3>
        <div className="chart-error">{error}</div>
      </div>
    );
  }

  if (seriesData.length === 0 || getPeriods.length === 0) {
    return (
      <div className="line-chart">
        <h3>Динамика развития</h3>
        <div className="chart-empty">
          <p>Нет данных для отображения динамики</p>
          <p className="chart-empty-hint">Оценки появятся после прохождения оценочных форм</p>
        </div>
      </div>
    );
  }

  const width = 500;
  const height = 300;
  const padding = 50;
  const minY = -1.5;
  const maxY = 3.5;

  const scaleX = (i) => {
    if (getPeriods.length === 1) return width / 2;
    return padding + (i / (getPeriods.length - 1)) * (width - padding * 2);
  };

  const scaleY = (v) =>
    height - padding - ((v - minY) / (maxY - minY)) * (height - padding * 2);

  const handleMouseEnter = (event, seriesLabel, pointIdx, value, totalPoints) => {
    const rect = event.target.getBoundingClientRect();
    const svgRect = event.target.ownerSVGElement?.getBoundingClientRect();
    
    if (svgRect) {
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2 - svgRect.left,
        y: rect.top - svgRect.top - 10,
        value: value,
        label: `${seriesLabel}, оценка #${pointIdx + 1} из ${totalPoints}`
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, value: null, label: null });
  };

  return (
    <div className="line-chart">
      <h3>Динамика развития</h3>

      <div className="chart-container" style={{ position: 'relative' }}>
        <svg width={width} height={height}>
          {/* Оси */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" strokeWidth="1" />
          
          {/* Стрелки */}
          <polygon points={`${padding - 4},${padding} ${padding},${padding - 6} ${padding + 4},${padding}`} fill="#ccc" />
          <polygon points={`${width - padding},${height - padding + 4} ${width - padding + 6},${height - padding} ${width - padding},${height - padding - 4}`} fill="#ccc" />
          
          {/* Горизонтальные линии уровней */}
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

          {/* Подписи недель/периодов */}
          {getPeriods.map((period, i) => {
            const x = scaleX(i);
            const isFirstOrLast = i === 0 || i === getPeriods.length - 1;
            return (
              <text
                key={period}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
                fontWeight={isFirstOrLast ? "500" : "normal"}
              >
                {period}
              </text>
            );
          })}

          {/* Подписи значений по Y */}
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

          {/* Названия осей */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="12"
            fill="#475569"
            fontWeight="500"
          >
            Номер оценки
          </text>

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

          {/* Линии графика (только если точек >= 2) */}
          {seriesData.map((s, i) => {
            const points = s.values.map((v, idx) => `${scaleX(idx)},${scaleY(v)}`).join(' ');
            
            if (s.values.length >= 2) {
              return (
                <polyline
                  key={`line-${i}`}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              );
            }
            return null;
          })}

          {/* Точки графика */}
          {seriesData.map((s, seriesIdx) => 
            s.values.map((v, pointIdx) => {
              if (v === null || v === undefined) return null;
              const [x, y] = [scaleX(pointIdx), scaleY(v)];
              return (
                <g key={`${seriesIdx}-${pointIdx}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => handleMouseEnter(e, s.label, pointIdx, v, s.values.length)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="white"
                    stroke={s.color}
                    strokeWidth="2.5"
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              );
            })
          )}
        </svg>
        
        {tooltip.visible && (
          <div 
            className="chart-tooltip"
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="tooltip-label">{tooltip.label}</div>
            <div className="tooltip-value">Балл: {tooltip.value.toFixed(1)}</div>
          </div>
        )}
      </div>

      <div className="chart-legend">
        {seriesData.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ background: s.color }} />
            {s.label}
            <span className="legend-count">({s.values.length} оценок)</span>
          </div>
        ))}
      </div>

      <div className="chart-note">
        {getPeriods.length === 1 ? (
          '* Пока доступна только одна оценка. После прохождения новых оценочных форм график пополнится новыми точками'
        ) : getPeriods.length === 2 ? (
          '* Пока доступно две оценки. После прохождения следующих оценочных форм появится линия тренда'
        ) : (
          '* График показывает динамику развития на основе всех полученных оценок'
        )}
      </div>
    </div>
  );
};

export default LineChart;