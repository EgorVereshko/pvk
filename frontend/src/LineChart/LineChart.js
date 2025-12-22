import React, {useEffect, useState} from 'react';
import './LineChart.css';
import axios from "axios";

const LineChart = ({user}) => {
  const [qualitiesStats, setQualitiesStats] = useState({
    'number_of_weeks': 0,
    'start_date': null,
    'end_date': null,
    'learning_list': [],
    'involvement_list': [],
    'organization_list': [],
    'teamwork_list': []
  })
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQualitiesStats();
  }, []);

  const fetchQualitiesStats = async () => {
    try {
      const response = await axios.get(`/api/qualities_stats/${user.id}/`);
      setQualitiesStats(response.data);
    } catch (err) {
      console.error('Error fetching qualities stats:', err);
      setError('Ошибка загрузки статистики качеств');
    } finally {
      setLoading(false);
    }
  };

  const {
    number_of_weeks,
    start_date,
    end_date,
    learning_list,
    involvement_list,
    organization_list,
    teamwork_list
  } = qualitiesStats;

  const formatted_start_date = new Date(start_date).toLocaleDateString('ru-RU')
  const formatted_end_date = new Date(end_date).toLocaleDateString('ru-RU')

  const series = [
    {
      label: 'Работа в команде',
      color: '#7dd3fc',
      values: teamwork_list,
    },
    {
      label: 'Вовлеченность',
      color: '#60a5fa',
      values: involvement_list,
    },
    {
      label: 'Организованность',
      color: '#2563eb',
      values: organization_list,
    },
    {
      label: 'Обучаемость',
      color: '#1e3a8a',
      values: learning_list,
    },
  ];

  const width = 420;
  const height = 220;
  const padding = 30;
  const minY = -1;
  const maxY = 3;

  const scaleX = (i) =>
    padding + (i / (number_of_weeks - 1)) * (width - padding * 2);

  const scaleY = (v) =>
    height - padding - ((v - minY) / (maxY - minY)) * (height - padding * 2);

  return (
    <div className="line-chart">
      <h3>Статистика за {formatted_start_date} – {formatted_end_date}</h3>

      <svg width={width} height={height}>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc"/>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc"/>

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
            <span className="legend-color" style={{background: s.color}}/>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
