// // import './SpiderChart.css';

// // const SpiderChart = () => {
// //   const data = [
// //     { label: 'Организованность', value: 1 },
// //     { label: 'Вовлеченность', value: -1 },
// //     { label: 'Работа в команде', value: 0 },
// //     { label: 'Обучаемость', value: 2 },
// //   ];

// //   const LEVEL_VALUES = [-1, 0, 1, 2, 3];

// //   const size = 320;
// //   const center = size / 2;
// //   const radius = size / 2 - 75; // - 50

// //   const angles = data.map(
// //     (_, i) => (i * 2 * Math.PI) / data.length
// //   );

// //   const valueToRadius = (value) =>
// //     ((value + 1) / (LEVEL_VALUES.length - 1)) * radius;

// //   const getPoint = (angle, value) => {
// //     const r = valueToRadius(value);
// //     return {
// //       x: center + r * Math.sin(angle),
// //       y: center - r * Math.cos(angle),
// //     };
// //   };

// //   const createLevelPolygon = (levelValue) =>
// //     angles
// //       .map((angle) => {
// //         const { x, y } = getPoint(angle, levelValue);
// //         return `${x},${y}`;
// //       })
// //       .join(' ');

// //   const dataPoints = data
// //     .map((item, i) => {
// //       const { x, y } = getPoint(angles[i], item.value);
// //       return `${x},${y}`;
// //     })
// //     .join(' ');

// //   return (
// //     <div className="spider-chart">
// //       <h3>Диаграмма качеств</h3>

// //       <svg width={size} height={size}>
// //         {LEVEL_VALUES.map((level, i) => (
// //           <polygon
// //             key={level}
// //             points={createLevelPolygon(level)}
// //             fill="none"
// //             stroke="#e0e0e0"
// //             strokeWidth="1"
// //             strokeDasharray={i === LEVEL_VALUES.length - 1 ? 'none' : '3,3'}
// //           />
// //         ))}

// //         {angles.map((angle, i) => (
// //           <line
// //             key={i}
// //             x1={center}
// //             y1={center}
// //             x2={center + radius * Math.sin(angle)}
// //             y2={center - radius * Math.cos(angle)}
// //             stroke="#e0e0e0"
// //           />
// //         ))}

// //         <polygon
// //           points={dataPoints}
// //           fill="rgba(74,144,226,0.3)"
// //           stroke="#4a90e2"
// //           strokeWidth="2"
// //         />

// //         {data.map((item, i) => {
// //           const { x, y } = getPoint(angles[i], item.value);
// //           return (
// //             <g key={i}>
// //               <circle cx={x} cy={y} r="4" fill="#4a90e2" />
// //               <text
// //                 x={x}
// //                 y={y - 10}
// //                 textAnchor="middle"
// //                 className="value-label"
// //               >
// //                 {item.value}
// //               </text>
// //             </g>
// //           );
// //         })}

// //         {angles.map((angle, i) => {
// //           const labelRadius = radius + 35;
// //           const x = center + labelRadius * Math.sin(angle);
// //           const y = center - labelRadius * Math.cos(angle);

// //           return (
// //             <text
// //               key={i}
// //               x={x}
// //               y={y}
// //               textAnchor="middle"
// //               dominantBaseline="middle"
// //               className="spider-label"
// //             >
// //               {data[i].label}
// //             </text>
// //           );
// //         })}

// //         <circle cx={center} cy={center} r="3" fill="#4a90e2" />
// //       </svg>
// //     </div>
// //   );
// // };

// // export default SpiderChart;

// import React from 'react';
// import './SpiderChart.css';

// const SpiderChart = ({ userScores = {} }) => {
//   // Используем переданные оценки или значения по умолчанию
//   const data = [
//     { label: 'Организованность', value: userScores['Организованность'] ?? 1.0 },
//     { label: 'Вовлеченность', value: userScores['Вовлеченность'] ?? 1.0 },
//     { label: 'Работа в команде', value: userScores['Работа в команде'] ?? 1.0 },
//     { label: 'Обучаемость', value: userScores['Обучаемость'] ?? 1.0 },
//   ];

//   const LEVEL_VALUES = [-1, 0, 1, 2, 3];

//   const size = 320;
//   const center = size / 2;
//   const radius = size / 2 - 75;

//   const angles = data.map(
//     (_, i) => (i * 2 * Math.PI) / data.length
//   );

//   const valueToRadius = (value) =>
//     ((value + 1) / (LEVEL_VALUES.length - 1)) * radius;

//   const getPoint = (angle, value) => {
//     const r = valueToRadius(value);
//     return {
//       x: center + r * Math.sin(angle),
//       y: center - r * Math.cos(angle),
//     };
//   };

//   const createLevelPolygon = (levelValue) =>
//     angles
//       .map((angle) => {
//         const { x, y } = getPoint(angle, levelValue);
//         return `${x},${y}`;
//       })
//       .join(' ');

//   const dataPoints = data
//     .map((item, i) => {
//       const { x, y } = getPoint(angles[i], item.value);
//       return `${x},${y}`;
//     })
//     .join(' ');

//   return (
//     <div className="spider-chart">
//       <h3>Диаграмма качеств</h3>

//       <svg width={size} height={size}>
//         {LEVEL_VALUES.map((level, i) => (
//           <polygon
//             key={level}
//             points={createLevelPolygon(level)}
//             fill="none"
//             stroke="#e0e0e0"
//             strokeWidth="1"
//             strokeDasharray={i === LEVEL_VALUES.length - 1 ? 'none' : '3,3'}
//           />
//         ))}

//         {angles.map((angle, i) => (
//           <line
//             key={i}
//             x1={center}
//             y1={center}
//             x2={center + radius * Math.sin(angle)}
//             y2={center - radius * Math.cos(angle)}
//             stroke="#e0e0e0"
//           />
//         ))}

//         <polygon
//           points={dataPoints}
//           fill="rgba(74,144,226,0.3)"
//           stroke="#4a90e2"
//           strokeWidth="2"
//         />

//         {data.map((item, i) => {
//           const { x, y } = getPoint(angles[i], item.value);
//           return (
//             <g key={i}>
//               <circle cx={x} cy={y} r="4" fill="#4a90e2" />
//               <text
//                 x={x}
//                 y={y - 10}
//                 textAnchor="middle"
//                 className="value-label"
//               >
//                 {item.value.toFixed(1)}
//               </text>
//             </g>
//           );
//         })}

//         {angles.map((angle, i) => {
//           const labelRadius = radius + 35;
//           const x = center + labelRadius * Math.sin(angle);
//           const y = center - labelRadius * Math.cos(angle);

//           return (
//             <text
//               key={i}
//               x={x}
//               y={y}
//               textAnchor="middle"
//               dominantBaseline="middle"
//               className="spider-label"
//             >
//               {data[i].label}
//             </text>
//           );
//         })}

//         <circle cx={center} cy={center} r="3" fill="#4a90e2" />
//       </svg>
//     </div>
//   );
// };

// export default SpiderChart;

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LabelList } from 'recharts';
import './SpiderChart.css';

const SpiderChart = ({ userScores = {} }) => {
  // Преобразуем данные в формат для Recharts
  const data = [
    { subject: 'Организованность', value: userScores['Организованность'] ?? 1.0, fullMark: 3 },
    { subject: 'Вовлеченность', value: userScores['Вовлеченность'] ?? 1.0, fullMark: 3 },
    { subject: 'Работа в команде', value: userScores['Работа в команде'] ?? 1.0, fullMark: 3 },
    { subject: 'Обучаемость', value: userScores['Обучаемость'] ?? 1.0, fullMark: 3 },
  ];

  // Настраиваем домен (диапазон значений) от -1 до 3
  const minValue = -1;
  const maxValue = 3;

  return (
    <div className="spider-chart">
      <h3>Диаграмма качеств</h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data} margin={{ top: 40, right: 60, bottom: 40, left: 60 }}>
          {/* Сетка */}
          <PolarGrid />
          
          {/* Оси с подписями */}
          <PolarAngleAxis dataKey="subject" />
          
          {/* Радиальная ось со значениями от -1 до 3 */}
          <PolarRadiusAxis 
            angle={30} 
            domain={[minValue, maxValue]} 
            tickCount={5}
            tickFormatter={(value) => value.toFixed(0)}
          />
          
          {/* Сама диаграмма */}
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