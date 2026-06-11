import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../../api';
import './LineChart.scss';

const LineChart = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: null, label: null });
  const scrollContainerRef = useRef(null);
  const chartContentRef = useRef(null);

  const colors = {
    'Работа в команде': '#7dd3fc',
    'Вовлеченность': '#60a5fa',
    'Организованность': '#2563eb',
    'Обучаемость': '#1e3a8a',
  };

  const CHART_WIDTH = 500;
  const AXIS_WIDTH = 50;
  const POINT_SPACING = 80;
  const RIGHT_PADDING = 40;
  const TOP_PADDING = 30;
  const BOTTOM_PADDING = 50;
  const HEIGHT = 350;

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

  const totalPoints = getPeriods.length;
  
  const chartContentWidth = totalPoints <= 1 
    ? CHART_WIDTH - AXIS_WIDTH
    : (totalPoints - 1) * POINT_SPACING + RIGHT_PADDING;

  const minY = -1.5;
  const maxY = 3.5;

  const scaleX = (i) => {
    if (totalPoints === 1) return (chartContentWidth - RIGHT_PADDING) / 2;
    return i * POINT_SPACING;
  };

  const scaleY = (v) =>
    HEIGHT - BOTTOM_PADDING - ((v - minY) / (maxY - minY)) * (HEIGHT - TOP_PADDING - BOTTOM_PADDING);

  const handleMouseEnter = (event, seriesLabel, pointIdx, value) => {
    const rect = event.target.getBoundingClientRect();
    const containerRect = scrollContainerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2 - containerRect.left + AXIS_WIDTH,
        y: rect.top - containerRect.top - 10,
        value: value,
        label: `${seriesLabel}, оценка #${pointIdx + 1} из ${seriesData[0]?.values.length || 0}`
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, value: null, label: null });
  };

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

  return (
    <div className="line-chart">
      <h3>Динамика развития</h3>

      <div className="chart-container">
        <div className="chart-axis-panel">
          <svg width={AXIS_WIDTH} height={HEIGHT} className="axis-svg">
            <line x1={AXIS_WIDTH - 5} y1={TOP_PADDING} x2={AXIS_WIDTH - 5} y2={HEIGHT - BOTTOM_PADDING} stroke="#ccc" strokeWidth="1" />
            
            <polygon points={`${AXIS_WIDTH - 9},${TOP_PADDING} ${AXIS_WIDTH - 5},${TOP_PADDING - 6} ${AXIS_WIDTH - 1},${TOP_PADDING}`} fill="#ccc" />
            
            {[-1, 0, 1, 2, 3].map(level => {
              const y = scaleY(level);
              return (
                <text
                  key={level}
                  x={AXIS_WIDTH - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {level}
                </text>
              );
            })}
            
            <text
              x={-HEIGHT / 2 + 20}
              y={12}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="11"
              fill="#475569"
              fontWeight="500"
            >
              Оценка
            </text>
          </svg>
        </div>

        <div className="chart-scroll-area">
          <div 
            className="chart-scrollable"
            ref={scrollContainerRef}
            style={{ 
              width: CHART_WIDTH - AXIS_WIDTH,
              overflowX: 'auto',
              overflowY: 'visible'
            }}
          >
            <div 
              className="chart-content"
              ref={chartContentRef}
              style={{ 
                width: chartContentWidth,
                minWidth: '100%',
                height: HEIGHT,
                position: 'relative'
              }}
            >
              <svg width={chartContentWidth} height={HEIGHT} className="chart-svg">
                <g className="grid-lines">
                  {[-1, 0, 1, 2, 3].map(level => {
                    const y = scaleY(level);
                    return (
                      <line
                        key={level}
                        x1={0}
                        y1={y}
                        x2={chartContentWidth}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                    );
                  })}
                </g>

                <g className="x-labels">
                  {getPeriods.map((period, i) => {
                    const x = scaleX(i);
                    return (
                      <text
                        key={period}
                        x={x}
                        y={HEIGHT - BOTTOM_PADDING + 20}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#6b7280"
                      >
                        {period}
                      </text>
                    );
                  })}
                </g>

                {/* Линии графика */}
                {seriesData.map((s, i) => {
                  const points = s.values.map((v, idx) => {
                    const x = scaleX(idx);
                    const y = scaleY(v);
                    return `${x},${y}`;
                  }).join(' ');
                  
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
                    const x = scaleX(pointIdx);
                    const y = scaleY(v);
                    return (
                      <g key={`${seriesIdx}-${pointIdx}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r="12"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => handleMouseEnter(e, s.label, pointIdx, v)}
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
            </div>
          </div>
          
          {/* Подпись оси X */}
          <div className="axis-x-label" style={{ width: CHART_WIDTH - AXIS_WIDTH }}>
            <span>Номер оценки / Неделя</span>
          </div>

          {/* Индикатор скролла */}
          {chartContentWidth > CHART_WIDTH - AXIS_WIDTH && (
            <div className="scroll-indicator">
              <span className="scroll-hint">← Прокрутите для просмотра всех оценок →</span>
            </div>
          )}
        </div>
      </div>

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

      <div className="chart-legend">
        {seriesData.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ background: s.color }} />
            {s.label}
            <span className="legend-count">(Оценок: {s.values.length})</span>
          </div>
        ))}
      </div>

      <div className="chart-note">
        {totalPoints === 1 ? (
          '* Пока доступна только одна оценка. После прохождения новых оценочных форм график пополнится новыми точками'
        ) : totalPoints === 2 ? (
          '* Пока доступно две оценки. После прохождения следующих оценочных форм появится линия тренда'
        ) : chartContentWidth > CHART_WIDTH - AXIS_WIDTH ? (
          `* Всего ${totalPoints} оценок. Используйте горизонтальную прокрутку для просмотра всех данных`
        ) : (
          '* График показывает динамику развития на основе всех полученных оценок'
        )}
      </div>
    </div>
  );
};

export default LineChart;