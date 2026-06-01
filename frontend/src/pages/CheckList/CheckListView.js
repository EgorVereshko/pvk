// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import api from '../../api';
// import Header from '../../components/Header/Header';
// import './CheckList.css';

// const CheckListView = () => {
//   const { id } = useParams();
//   const { user, logout, isTutor, isOrganizer } = useAuth();
//   const [checklist, setChecklist] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [teamMembers, setTeamMembers] = useState([]);
//   const [scores, setScores] = useState([]);
//   const [qualities, setQualities] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!isTutor() && !isOrganizer()) {
//       alert('Доступ запрещен');
//       navigate('/events/tutor');
//     }
//     loadChecklist();
//   }, [id]);

//   const loadChecklist = async () => {
//     try {
//       setLoading(true);
//       console.log('Загрузка чек-листа с ID:', id);
      
//       // 1. Получаем форму чек-листа через /api/forms/tutor/ (так как /fill не возвращает team)
//       const formsRes = await api.get('/api/forms/tutor/');
//       const form = formsRes.data.find(f => f.id === parseInt(id) && f.type === 'Чек-лист');
//       console.log('Найденная форма:', form);
      
//       if (!form) {
//         alert('Чек-лист не найден');
//         navigate('/events/tutor');
//         return;
//       }
      
//       // 2. Получаем название команды
//       const teamName = form.teams_names?.[0] || 'Без команды';
      
//       // 3. Получаем студентов из команды
//       let members = [];
//       if (teamName !== 'Без команды') {
//         const teamsRes = await api.get('/api/teams/');
//         const team = teamsRes.data.find(t => t.name === teamName);
//         if (team) {
//           const membersRes = await api.get(`/api/teams/${team.id}/members/`);
//           members = membersRes.data;
//           console.log('Студенты команды:', members);
//         }
//       }
//       setTeamMembers(members);
      
//       // 4. Получаем качества из формы
//       const qualitiesList = form.qualities || ['Обучаемость', 'Организованность', 'Работа в команде', 'Вовлеченность'];
//       setQualities(qualitiesList);
      
//       // 5. Получаем оценки для каждого студента
//       const scoresPromises = members.map(async (member) => {
//         try {
//           const scoresRes = await api.get(`/api/latest_qualities_scores/${member.id}/`);
//           return { studentId: member.id, scores: scoresRes.data };
//         } catch (err) {
//           console.error(`Ошибка загрузки оценок для студента ${member.id}:`, err);
//           return { studentId: member.id, scores: [] };
//         }
//       });
      
//       const allScores = await Promise.all(scoresPromises);
      
//       // 6. Формируем таблицу оценок
//       const scoresTable = qualitiesList.map(quality => {
//         return members.map(member => {
//           const studentScores = allScores.find(s => s.studentId === member.id);
//           if (studentScores && studentScores.scores) {
//             const scoreItem = studentScores.scores.find(s => s.quality_name === quality);
//             return scoreItem ? scoreItem.score : null;
//           }
//           return null;
//         });
//       });
//       setScores(scoresTable);
      
//       setChecklist({
//         id: form.id,
//         name: form.name,
//         date: form.end_datetime,
//         team_name: teamName,
//         qualities: qualitiesList,
//         status: form.status
//       });
      
//     } catch (error) {
//       console.error('Ошибка загрузки чек-листа:', error);
//       alert('Ошибка при загрузке чек-листа: ' + (error.response?.data?.error || error.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/');
//   };

//   if (loading) return <div className="loading">Загрузка...</div>;
//   if (!checklist) return <div className="error">Чек-лист не найден</div>;

//   return (
//     <div className="checklist-container">
//       <Header onLogout={handleLogout} user={user} />
      
//       <div className="checklist-content">
//         <div className="checklist-card">
//           <div className="checklist-header">
//             <h1>{checklist.name}</h1>
//             <button className="back-button" onClick={() => navigate('/events/tutor')}>
//               ← Назад
//             </button>
//           </div>

//           <div className="event-info">
//             <p><strong>Дата:</strong> {new Date(checklist.date).toLocaleDateString('ru-RU')}</p>
//             <p><strong>Команда:</strong> {checklist.team_name}</p>
//             <p><strong>Статус:</strong> {checklist.status}</p>
//             <p><strong>Студентов в команде:</strong> {teamMembers.length}</p>
//           </div>

//           {teamMembers.length === 0 ? (
//             <div className="empty-state">
//               <p>Нет студентов в этой команде</p>
//             </div>
//           ) : (
//             <div className="checklist-table-wrapper">
//               <table className="checklist-table">
//                 <thead>
//                   <tr>
//                     <th>Студент / Качество</th>
//                     {qualities.map((quality, qIdx) => (
//                       <th key={qIdx}>{quality}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {teamMembers.map((member, sIdx) => (
//                     <tr key={member.id}>
//                       <td className="student-cell">
//                         <strong>{member.name}</strong>
//                        </td>
//                       {qualities.map((_, qIdx) => (
//                         <td key={qIdx}>
//                           <span className="score-value">
//                             {scores[qIdx]?.[sIdx] !== null && scores[qIdx]?.[sIdx] !== undefined
//                               ? scores[qIdx][sIdx]
//                               : '-'}
//                           </span>
//                         </td>
//                       ))}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CheckListView;





// Отображение локал данных
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Header from '../../components/Header/Header';
import './CheckList.scss';

const CheckListView = () => {
  const { id } = useParams();
  const { user, logout, isTutor, isOrganizer } = useAuth();
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [scores, setScores] = useState([]);
  const [qualities, setQualities] = useState([]);
  const navigate = useNavigate();

  const testStudents = [
    { id: 1, name: 'Петров П.П.' },
    { id: 2, name: 'Исаев А.А.' },
    { id: 3, name: 'Максимов М.М.' }
  ];

  const testQualities = ['Умение анализировать, выявлять существенное', 'Поведение в ситуации неопределенности', 'Умение планировать'];

  const testScores = [
    [-1, 0, 1, -1],
    [-1, -1, 1, 0],
    [0, -1, 1, 1]
  ];

  useEffect(() => {
    if (!isTutor() && !isOrganizer()) {
      alert('Доступ запрещен');
      navigate('/events/tutor');
    }
    
    loadTestData();
  }, [id]);

  const loadTestData = async () => {
    try {
      setLoading(true);
      
      setTeamMembers(testStudents);
      
      setQualities(testQualities);
      
      setScores(testScores);
      
      console.log('Загружены оценки:', testScores);
      console.log('Количество студентов:', testStudents.length);
      console.log('Количество качеств:', testQualities.length);
      
      setChecklist({
        id: id || 1,
        name: 'Тестовый чек-лист',
        date: new Date().toISOString(),
        team_name: 'Тестовая команда',
        qualities: testQualities,
        status: 'Активная'
      });
      
    } catch (error) {
      console.error('Ошибка загрузки тестовых данных:', error);
      alert('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return '—';
    return score;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!checklist) return <div className="error">Чек-лист не найден</div>;

  return (
    <div className="checklist-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="checklist-content">
        <div className="checklist-card">
          <div className="checklist-header">
            <h1>{checklist.name}</h1>
            <button className="back-button" onClick={() => navigate('/events/tutor')}>
              ← Назад
            </button>
          </div>

          <div className="event-info">
            <p><strong>Дата:</strong> {new Date(checklist.date).toLocaleDateString('ru-RU')}</p>
            <p><strong>Команда:</strong> {checklist.team_name}</p>
            <p><strong>Статус:</strong> {checklist.status}</p>
            <p><strong>Студентов в команде:</strong> {teamMembers.length}</p>
          </div>

          {teamMembers.length === 0 ? (
            <div className="empty-state">
              <p>Нет студентов в этой команде</p>
            </div>
          ) : (
            <div className="checklist-table-wrapper">
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th>Студент / Качество</th>
                    {qualities.map((quality, qIdx) => (
                      <th key={qIdx}>{quality}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, sIdx) => (
                    <tr key={member.id}>
                      <td className="student-cell">
                        <strong>{member.name}</strong>
                      </td>
                      {qualities.map((_, qIdx) => (
                        <td key={qIdx}>
                          <span className="score-value">
                            {scores[sIdx] && scores[sIdx][qIdx] !== undefined 
                              ? formatScore(scores[sIdx][qIdx]) 
                              : '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckListView;