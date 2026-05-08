// import React, { useState, useEffect } from 'react';
// import { useNavigate, Navigate } from 'react-router-dom';
// import axios from 'axios';
// import Header from '../Header/Header';
// import './EventsTutor.css';

// const EventsTutor = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('upcoming');
//   const [contentType, setContentType] = useState('assessment');
//   const [sortBy, setSortBy] = useState('date');
//   const [sortOrder, setSortOrder] = useState('asc');
//   const [selectedTeams, setSelectedTeams] = useState([]);
//   const [showTeamFilter, setShowTeamFilter] = useState(false);
//   const [showMenu, setShowMenu] = useState(null);
//   const navigate = useNavigate();

//   const [events] = useState([
//     { id: 1, name: 'Техническое собеседование', team: 'ЛК1', date: '2025-12-12' },
//     { id: 2, name: 'Оценка soft skills', team: 'ПВК', date: '2025-05-05' },
//     { id: 3, name: 'Групповая дискуссия', team: 'ЛК1', date: '2025-12-25' },
//     { id: 4, name: 'Вводное собрание', team: 'ЛК2', date: '2025-11-28' },
//     { id: 5, name: 'Тестирование навыков', team: 'Команда3', date: '2025-11-22' },
//     { id: 6, name: 'Финальное интервью', team: 'ЛК1', date: '2025-12-30' }
//   ]);

//   const getEventType = (eventDate) => {
//     const today = new Date();
//     const event = new Date(eventDate);
//     return event >= today ? 'upcoming' : 'completed';
//   };

//   const eventsWithType = events.map(event => ({
//     ...event,
//     type: getEventType(event.date)
//   }));

//   const teams = [...new Set(events.map(event => event.team))];

//   useEffect(() => {
//     const fetchUser = async () => {
//       const token = localStorage.getItem('access_token');
      
//       if (!token) {
//         navigate('/');
//         return;
//       }

//       try {
//         const response = await axios.get('http://localhost:8000/api/user/', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setUser(response.data);
//         setError(null);
//       } catch (err) {
//         if (err.response?.status === 401) {
//           localStorage.removeItem('access_token');
//           localStorage.removeItem('refresh_token');
//           navigate('/');
//         } else {
//           setError('Ошибка при загрузке данных пользователя');
//         }
//         console.error('Ошибка:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('refresh_token');
//     navigate('/');
//   };

//   const handleSort = (field) => {
//     if (sortBy === field) {
//       setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortBy(field);
//       setSortOrder('asc');
//     }
//   };

//   const handleTeamFilter = (team) => {
//     setSelectedTeams(prev =>
//       prev.includes(team)
//         ? prev.filter(t => t !== team)
//         : [...prev, team]
//     );
//   };

//   const toggleTeamFilter = () => {
//     setShowTeamFilter(!showTeamFilter);
//   };

//   const toggleMenu = (eventId) => {
//     setShowMenu(showMenu === eventId ? null : eventId);
//   };

//   const handleMenuAction = (action, eventId) => {
//     console.log(`${action} мероприятие ${eventId}`);
//     setShowMenu(null);
//     // Здесь будет логика для каждого действия
//   };

//   const filteredAndSortedEvents = eventsWithType
//     .filter(event => event.type === activeTab)
//     .filter(event => selectedTeams.length === 0 || selectedTeams.includes(event.team))
//     .sort((a, b) => {
//       if (sortBy === 'name') {
//         return sortOrder === 'asc' 
//           ? a.name.localeCompare(b.name)
//           : b.name.localeCompare(a.name);
//       } else if (sortBy === 'team') {
//         return sortOrder === 'asc'
//           ? a.team.localeCompare(b.team)
//           : b.team.localeCompare(a.team);
//       } else {
//         return sortOrder === 'asc'
//           ? new Date(a.date) - new Date(b.date)
//           : new Date(b.date) - new Date(a.date);
//       }
//     });

//   if (loading) {
//     return <div className="loading">Загрузка...</div>;
//   }

//   if (!user) {
//     return <Navigate to="/" replace />;
//   }

//   return (
//     <div className="profile-container">
//       <Header onLogout={handleLogout} user={user} />
      
//       <div className="profile-content">
//         <div className="content-type-switcher">
//           <button 
//             className={`type-button ${contentType === 'checklist' ? 'active' : ''}`}
//             onClick={() => setContentType('checklist')}
//           >
//             Чек-листы
//           </button>
//           <button 
//             className={`type-button ${contentType === 'assessment' ? 'active' : ''}`}
//             onClick={() => setContentType('assessment')}
//           >
//             Оценочные мероприятия
//           </button>
//         </div>

//         <div className="tabs">
//           <button 
//             className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
//             onClick={() => setActiveTab('upcoming')}
//           >
//             Предстоящие
//           </button>
//           <button 
//             className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
//             onClick={() => setActiveTab('completed')}
//           >
//             Пройденные
//           </button>
//         </div>

//         <div className="tab-content">
//           <div className="events-info">
//             <div className="events-header-main">
//               <h1>
//                 {contentType === 'checklist' ? 'Чек-листы' : 'Оценочные мероприятия'}
//               </h1>
//               <button className="create-button">
//                 Создать
//               </button>
//             </div>
            
//             <div className="filter-section">
//               <div className="filter-buttons">
//                 <button 
//                   className={`filter-button name-button ${sortBy === 'name' ? 'active' : ''}`}
//                   onClick={() => handleSort('name')}
//                 >
//                   Название {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
//                 </button>
//                 <button 
//                   className={`filter-button team-filter ${showTeamFilter ? 'active' : ''}`}
//                   onClick={toggleTeamFilter}
//                 >
//                   Команда {showTeamFilter && '▼'}
//                 </button>
//                 <button 
//                   className={`filter-button date-button ${sortBy === 'date' ? 'active' : ''}`}
//                   onClick={() => handleSort('date')}
//                 >
//                   Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
//                 </button>
//               </div>

//               {showTeamFilter && (
//                 <div className="team-filter-dropdown">
//                   <div className="team-checkboxes">
//                     {teams.map(team => (
//                       <label key={team} className="team-checkbox">
//                         <input
//                           type="checkbox"
//                           checked={selectedTeams.includes(team)}
//                           onChange={() => handleTeamFilter(team)}
//                         />
//                         <span>{team}</span>
//                       </label>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="events-list">
//               {filteredAndSortedEvents.map(event => (
//                 <div key={event.id} className="event-item">
//                   <div className="event-content">
//                     <div className="event-name">{event.name}</div>
//                     <div className="event-team">{event.team}</div>
//                     <div className="event-date">
//                       {new Date(event.date).toLocaleDateString('ru-RU')}
//                     </div>
//                   </div>
//                   <div className="event-actions">
//                     <button 
//                       className="menu-button"
//                       onClick={() => toggleMenu(event.id)}
//                     >
//                       ⋮
//                     </button>
//                     {showMenu === event.id && (
//                       <div className="action-menu left">
//                         <button onClick={() => handleMenuAction('edit', event.id)}>
//                           Редактировать
//                         </button>
//                         <button onClick={() => handleMenuAction('input', event.id)}>
//                           Внести данные
//                         </button>
//                         <button onClick={() => handleMenuAction('view', event.id)}>
//                           Посмотреть
//                         </button>
//                         <button 
//                           onClick={() => handleMenuAction('delete', event.id)}
//                           className="delete-action"
//                         >
//                           Удалить
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EventsTutor;




import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../../api';
import Header from '../../../components/Header/Header';
import './EventsTutor.css';

const EventsTutor = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [contentType, setContentType] = useState('checklist');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  
  // Реальные данные из БД
  const [events, setEvents] = useState([]);
  const [checklists, setChecklists] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/user/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        
        // После получения пользователя, загружаем данные
        fetchEvents();
        fetchChecklists();
        
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/');
        } else {
          setError('Ошибка при загрузке данных пользователя');
        }
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      // Получаем мероприятия текущего пользователя
      const response = await axios.get('http://localhost:8000/api/events/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
    }
  };

  const fetchChecklists = async () => {
    try {
      // Получаем чек-листы текущего пользователя
      const response = await axios.get('http://localhost:8000/api/checklists/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setChecklists(response.data);
      console.log('Загруженные чек-листы:', response.data); // Для отладки
    } catch (error) {
      console.error('Ошибка загрузки чек-листов:', error);
    }
  };

  const getEventType = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    return event >= today ? 'upcoming' : 'completed';
  };

  // Объединяем мероприятия и чек-листы для отображения
  const getAllItems = () => {
    if (contentType === 'assessment') {
      return events.map(event => ({
        id: event.id,
        name: event.name || `Мероприятие ${event.id}`,
        team: event.team_name || 'Без команды',
        date: event.datetime,
        type: getEventType(event.datetime),
        itemType: 'event'  // ВАЖНО: указываем тип
      }));
    } else {
      // Для чек-листов
      return checklists.map(cl => ({
        id: cl.id,
        name: cl.event_name || `Чек-лист ${cl.id}`,
        team: cl.team_name || 'Без команды',
        date: cl.event_datetime,
        type: getEventType(cl.event_datetime),
        student: cl.evaluated_student,
        indicators: cl.indicators,
        itemType: 'checklist'  // ВАЖНО: указываем тип
      }));
    }
  };

  const items = getAllItems();
  const teams = [...new Set(items.map(item => item.team).filter(Boolean))];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleTeamFilter = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  const toggleTeamFilter = () => {
    setShowTeamFilter(!showTeamFilter);
  };

  const toggleMenu = (itemId) => {
    setShowMenu(showMenu === itemId ? null : itemId);
  };

  const handleMenuAction = (action, itemId, itemType) => {
    console.log(`${action} элемент ${itemId} типа ${itemType}`); // Для отладки
    
    if (action === 'view') {
      if (itemType === 'checklist') {
        // Перенаправляем на страницу просмотра чек-листа
        navigate(`/checklist/view/${itemId}`);
      } else if (itemType === 'event') {
        // Для мероприятий (если есть страница)
        navigate(`/event/${itemId}`);
      }
    } else if (action === 'edit') {
      if (itemType === 'checklist') {
        navigate(`/checklist/edit/${itemId}`);
      }
    } else if (action === 'delete') {
      if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
        // Логика удаления
        if (itemType === 'checklist') {
          api.delete(`/api/checklist/${itemId}/delete/`)
            .then(() => {
              fetchChecklists();
              alert('Чек-лист удален');
            })
            .catch(error => {
              console.error('Ошибка удаления:', error);
              alert('Ошибка при удалении');
            });
        }
      }
    }
    
    setShowMenu(null);
  };

  const filteredAndSortedItems = items
    .filter(item => item.type === activeTab)
    .filter(item => selectedTeams.length === 0 || selectedTeams.includes(item.team))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'team') {
        return sortOrder === 'asc'
          ? a.team.localeCompare(b.team)
          : b.team.localeCompare(a.team);
      } else {
        return sortOrder === 'asc'
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
    });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="profile-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="profile-content">
        <div className="events-header-main">
          <h1>
            {contentType === 'checklist' ? 'Чек-листы' : 'Оценочные мероприятия'}
          </h1>
          <button 
            className="create-button"
            onClick={() => navigate('/checklist/create')}
          >
            Создать
          </button>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Предстоящие
            </button>
            <button 
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Пройденные
            </button>
          </div>

          <div className="tabs content-type-tabs">
            <button 
              className={`tab ${contentType === 'checklist' ? 'active' : ''}`}
              onClick={() => setContentType('checklist')}
            >
              Чек-листы
            </button>
            <button 
              className={`tab ${contentType === 'assessment' ? 'active' : ''}`}
              onClick={() => setContentType('assessment')}
            >
              Оценочные мероприятия
            </button>
          </div>
        </div>

        <div className="tab-content">
          <div className="events-info">
            <div className="filter-section">
              <div className="filter-buttons">
                <button 
                  className={`filter-button name-button ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Название {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`filter-button team-filter ${showTeamFilter ? 'active' : ''}`}
                  onClick={toggleTeamFilter}
                >
                  Команда {showTeamFilter && '▼'}
                </button>
                <button 
                  className={`filter-button date-button ${sortBy === 'date' ? 'active' : ''}`}
                  onClick={() => handleSort('date')}
                >
                  Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              {showTeamFilter && (
                <div className="team-filter-dropdown">
                  <div className="team-checkboxes">
                    {teams.map(team => (
                      <label key={team} className="team-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team)}
                          onChange={() => handleTeamFilter(team)}
                        />
                        <span>{team}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="events-list">
              {filteredAndSortedItems.length === 0 ? (
                <div className="empty-state">
                  <p>Нет данных для отображения</p>
                  {contentType === 'checklist' && (
                    <button 
                      className="create-button"
                      onClick={() => navigate('/checklist/create')}
                    >
                      Создать первый чек-лист
                    </button>
                  )}
                </div>
              ) : (
                filteredAndSortedItems.map(item => (
                  <div key={item.id} className="event-item">
                    <div className="event-content">
                      <div className="event-name">{item.name}</div>
                      <div className="event-team">{item.team}</div>
                      <div className="event-date">
                        {new Date(item.date).toLocaleDateString('ru-RU')}
                      </div>
                      {item.student && (
                        <div className="event-student">
                          Студент: {item.student}
                        </div>
                      )}
                    </div>
                    <div className="event-actions">
                      <button 
                        className="menu-button"
                        onClick={() => toggleMenu(item.id)}
                      >
                        ⋮
                      </button>
                      {showMenu === item.id && (
                        <div className="action-menu left">
                          <button onClick={() => handleMenuAction('view', item.id, item.itemType)}>
                            Посмотреть
                          </button>
                          {item.itemType === 'checklist' && (
                            <button onClick={() => handleMenuAction('edit', item.id, item.itemType)}>
                              Редактировать
                            </button>
                          )}
                          <button 
                            onClick={() => handleMenuAction('delete', item.id, item.itemType)}
                            className="delete-action"
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsTutor;









// import React, { useState, useEffect } from 'react';
// import { useNavigate, Navigate } from 'react-router-dom';
// import axios from 'axios';
// import Header from '../Header/Header';
// import './EventsTutor.css';

// const EventsTutor = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('upcoming');
//   const [contentType, setContentType] = useState('assessment');
//   const [sortBy, setSortBy] = useState('date');
//   const [sortOrder, setSortOrder] = useState('asc');
//   const [selectedTeams, setSelectedTeams] = useState([]);
//   const [showTeamFilter, setShowTeamFilter] = useState(false);
//   const [showMenu, setShowMenu] = useState(null);
//   const navigate = useNavigate();

//   const [events] = useState([
//     { id: 1, name: 'Техническое собеседование', team: 'ЛК1', date: '2025-12-12' },
//     { id: 2, name: 'Оценка soft skills', team: 'ПВК', date: '2025-05-05' },
//     { id: 3, name: 'Групповая дискуссия', team: 'ЛК1', date: '2025-12-25' },
//     { id: 4, name: 'Вводное собрание', team: 'ЛК2', date: '2025-11-28' },
//     { id: 5, name: 'Тестирование навыков', team: 'Команда3', date: '2025-11-22' },
//     { id: 6, name: 'Финальное интервью', team: 'ЛК1', date: '2025-12-30' }
//   ]);

//   const getEventType = (eventDate) => {
//     const today = new Date();
//     const event = new Date(eventDate);
//     return event >= today ? 'upcoming' : 'completed';
//   };

//   const eventsWithType = events.map(event => ({
//     ...event,
//     type: getEventType(event.date)
//   }));

//   const teams = [...new Set(events.map(event => event.team))];

//   useEffect(() => {
//     const fetchUser = async () => {
//       const token = localStorage.getItem('access_token');
      
//       if (!token) {
//         navigate('/');
//         return;
//       }

//       try {
//         const response = await axios.get('http://localhost:8000/api/user/', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setUser(response.data);
//         setError(null);
//       } catch (err) {
//         if (err.response?.status === 401) {
//           localStorage.removeItem('access_token');
//           localStorage.removeItem('refresh_token');
//           navigate('/');
//         } else {
//           setError('Ошибка при загрузке данных пользователя');
//         }
//         console.error('Ошибка:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('refresh_token');
//     navigate('/');
//   };

//   const handleSort = (field) => {
//     if (sortBy === field) {
//       setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortBy(field);
//       setSortOrder('asc');
//     }
//   };

//   const handleTeamFilter = (team) => {
//     setSelectedTeams(prev =>
//       prev.includes(team)
//         ? prev.filter(t => t !== team)
//         : [...prev, team]
//     );
//   };

//   const toggleTeamFilter = () => {
//     setShowTeamFilter(!showTeamFilter);
//   };

//   const toggleMenu = (eventId) => {
//     setShowMenu(showMenu === eventId ? null : eventId);
//   };

//   const handleMenuAction = (action, eventId) => {
//     console.log(`${action} мероприятие ${eventId}`);
//     setShowMenu(null);
//     // Здесь будет логика для каждого действия
//   };

//   const filteredAndSortedEvents = eventsWithType
//     .filter(event => event.type === activeTab)
//     .filter(event => selectedTeams.length === 0 || selectedTeams.includes(event.team))
//     .sort((a, b) => {
//       if (sortBy === 'name') {
//         return sortOrder === 'asc' 
//           ? a.name.localeCompare(b.name)
//           : b.name.localeCompare(a.name);
//       } else if (sortBy === 'team') {
//         return sortOrder === 'asc'
//           ? a.team.localeCompare(b.team)
//           : b.team.localeCompare(a.team);
//       } else {
//         return sortOrder === 'asc'
//           ? new Date(a.date) - new Date(b.date)
//           : new Date(b.date) - new Date(a.date);
//       }
//     });

//   if (loading) {
//     return <div className="loading">Загрузка...</div>;
//   }

//   if (!user) {
//     return <Navigate to="/" replace />;
//   }

//   return (
//     <div className="profile-container">
//       <Header onLogout={handleLogout} user={user} />
      
//       <div className="profile-content">
//         <div className="events-header-main">
//           <h1>
//             {contentType === 'checklist' ? 'Чек-листы' : 'Оценочные мероприятия'}
//           </h1>
//           <button className="create-button">
//             Создать
//           </button>
//         </div>

//         {/* Обертка для всех табов в одной строке */}
//         <div className="tabs-container">
//           <div className="tabs">
//             <button 
//               className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
//               onClick={() => setActiveTab('upcoming')}
//             >
//               Предстоящие
//             </button>
//             <button 
//               className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
//               onClick={() => setActiveTab('completed')}
//             >
//               Пройденные
//             </button>
//           </div>

//           <div className="tabs content-type-tabs">
//             <button 
//               className={`tab ${contentType === 'checklist' ? 'active' : ''}`}
//               onClick={() => setContentType('checklist')}
//             >
//               Чек-листы
//             </button>
//             <button 
//               className={`tab ${contentType === 'assessment' ? 'active' : ''}`}
//               onClick={() => setContentType('assessment')}
//             >
//               Оценочные мероприятия
//             </button>
//           </div>
//         </div>

//         <div className="tab-content">
//           <div className="events-info">
//             <div className="filter-section">
//               <div className="filter-buttons">
//                 <button 
//                   className={`filter-button name-button ${sortBy === 'name' ? 'active' : ''}`}
//                   onClick={() => handleSort('name')}
//                 >
//                   Название {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
//                 </button>
//                 <button 
//                   className={`filter-button team-filter ${showTeamFilter ? 'active' : ''}`}
//                   onClick={toggleTeamFilter}
//                 >
//                   Команда {showTeamFilter && '▼'}
//                 </button>
//                 <button 
//                   className={`filter-button date-button ${sortBy === 'date' ? 'active' : ''}`}
//                   onClick={() => handleSort('date')}
//                 >
//                   Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
//                 </button>
//               </div>

//               {showTeamFilter && (
//                 <div className="team-filter-dropdown">
//                   <div className="team-checkboxes">
//                     {teams.map(team => (
//                       <label key={team} className="team-checkbox">
//                         <input
//                           type="checkbox"
//                           checked={selectedTeams.includes(team)}
//                           onChange={() => handleTeamFilter(team)}
//                         />
//                         <span>{team}</span>
//                       </label>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="events-list">
//               {filteredAndSortedEvents.map(event => (
//                 <div key={event.id} className="event-item">
//                   <div className="event-content">
//                     <div className="event-name">{event.name}</div>
//                     <div className="event-team">{event.team}</div>
//                     <div className="event-date">
//                       {new Date(event.date).toLocaleDateString('ru-RU')}
//                     </div>
//                   </div>
//                   <div className="event-actions">
//                     <button 
//                       className="menu-button"
//                       onClick={() => toggleMenu(event.id)}
//                     >
//                       ⋮
//                     </button>
//                     {showMenu === event.id && (
//                       <div className="action-menu left">
//                         <button onClick={() => handleMenuAction('edit', event.id)}>
//                           Редактировать
//                         </button>
//                         <button onClick={() => handleMenuAction('input', event.id)}>
//                           Внести данные
//                         </button>
//                         <button onClick={() => handleMenuAction('view', event.id)}>
//                           Посмотреть
//                         </button>
//                         <button 
//                           onClick={() => handleMenuAction('delete', event.id)}
//                           className="delete-action"
//                         >
//                           Удалить
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EventsTutor;