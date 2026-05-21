import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LabelList } from 'recharts';
import './SpiderChart.css';

const SpiderChart = ({ userScores = {} }) => {
  const data = [
    { subject: 'Организованность', value: userScores['Организованность'] ?? 1.0, fullMark: 3 },
    { subject: 'Вовлеченность', value: userScores['Вовлеченность'] ?? 1.0, fullMark: 3 },
    { subject: 'Работа в команде', value: userScores['Работа в команде'] ?? 1.0, fullMark: 3 },
    { subject: 'Обучаемость', value: userScores['Обучаемость'] ?? 1.0, fullMark: 3 },
  ];

  const minValue = -1;
  const maxValue = 3;

  return (
    <div className="spider-chart">
      <h3>Диаграмма качеств</h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data} margin={{ top: 40, right: 60, bottom: 40, left: 60 }}>
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

      <div className="chart-note">
        * Значения от -1 до 3
      </div>
    </div>
  );
};

export default SpiderChart;