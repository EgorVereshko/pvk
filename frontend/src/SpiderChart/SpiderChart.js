import './SpiderChart.css';
import {useEffect, useState} from "react";
import axios from "axios";

const SpiderChart = ({user}) => {
  const [qualitiesData, setQualitiesData] = useState({
    learning_score: 0.0,
    involvement_score: 0.0,
    organization_score: 0.0,
    teamwork_score: 0.0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQualitiesData();
  }, []);

  const fetchQualitiesData = async () => {
    try {
      const response = await axios.get(`/api/qualities/${user.id}/`);
      setQualitiesData(response.data);
    } catch (err) {
      console.error('Error fetching qualities ', err);
      setError('Ошибка загрузки данных о качествах');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div style={{color: 'red'}}>{error}</div>;
  }

  const data = [
    {label: 'Организованность', value: qualitiesData.organization_score},
    {label: 'Вовлеченность', value: qualitiesData.involvement_score},
    {label: 'Работа в команде', value: qualitiesData.teamwork_score},
    {label: 'Обучаемость', value: qualitiesData.learning_score},
  ];

  const LEVEL_VALUES = [-1, 0, 1, 2, 3];

  const size = 320;
  const center = size / 2;
  const radius = size / 2 - 75; // - 50

  const angles = data.map(
    (_, i) => (i * 2 * Math.PI) / data.length
  );

  const valueToRadius = (value) =>
    ((value + 1) / (LEVEL_VALUES.length - 1)) * radius;

  const getPoint = (angle, value) => {
    const r = valueToRadius(value);
    return {
      x: center + r * Math.sin(angle),
      y: center - r * Math.cos(angle),
    };
  };

  const createLevelPolygon = (levelValue) =>
    angles
      .map((angle) => {
        const {x, y} = getPoint(angle, levelValue);
        return `${x},${y}`;
      })
      .join(' ');

  const dataPoints = data
    .map((item, i) => {
      const {x, y} = getPoint(angles[i], item.value);
      return `${x},${y}`;
    })
    .join(' ');

  if (loading) {
    return <div>Загрузка данных о качествах...</div>;
  }

  return (
    <div className="spider-chart">
      <h3>Диаграмма качеств</h3>

      <svg width={size} height={size}>
        {LEVEL_VALUES.map((level, i) => (
          <polygon
            key={level}
            points={createLevelPolygon(level)}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="1"
            strokeDasharray={i === LEVEL_VALUES.length - 1 ? 'none' : '3,3'}
          />
        ))}

        {angles.map((angle, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.sin(angle)}
            y2={center - radius * Math.cos(angle)}
            stroke="#e0e0e0"
          />
        ))}

        <polygon
          points={dataPoints}
          fill="rgba(74,144,226,0.3)"
          stroke="#4a90e2"
          strokeWidth="2"
        />

        {data.map((item, i) => {
          const {x, y} = getPoint(angles[i], item.value);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#4a90e2"/>
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="value-label"
              >
                {item.value}
              </text>
            </g>
          );
        })}

        {angles.map((angle, i) => {
          const labelRadius = radius + 35;
          const x = center + labelRadius * Math.sin(angle);
          const y = center - labelRadius * Math.cos(angle);

          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="spider-label"
            >
              {data[i].label}
            </text>
          );
        })}

        <circle cx={center} cy={center} r="3" fill="#4a90e2"/>
      </svg>
    </div>
  );
};

export default SpiderChart;