import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './ListStudent.css';

const ListStudent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchStudents();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setCurrentUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchAverageScore = async (userId) => {
    try {
      const response = await api.get(`/api/latest_qualities_scores/${userId}/`);
      if (response.data && response.data.length > 0) {
        const hasRealScores = response.data.some(item => {
          return item.score !== 0 && item.score !== null;
        });
        if (hasRealScores) {
          const scores = response.data.map(item => item.score);
          const average = scores.reduce((a, b) => a + b, 0) / scores.length;
          return Math.round(average * 10) / 10;
        }
      }
      return null;
    } catch (err) {
      console.error(`Ошибка получения оценок для пользователя ${userId}:`, err);
      return null;
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/students/');
      console.log('Студенты:', response.data);

      if (response.data && response.data.length > 0) {
        const studentsWithRolesAndScores = await Promise.all(
          response.data.map(async (student, index) => {
            try {
              const userDetail = await api.get(`/api/user/${student.user_id}/`);
              const averageScore = await fetchAverageScore(student.user_id);
              const teamName = userDetail.data.team_name || 'Без команды';

              return {
                ...student,
                role: userDetail.data.roles?.[0] || 'Проектант',
                averageScore: averageScore,
                teamName: teamName,
              };
            } catch (err) {
              console.error(`Ошибка получения данных для ${student.full_name}:`, err);
              return {
                ...student,
                role: 'Проектант',
                averageScore: null,
                teamName: 'Без команды',
              };
            }
          })
        );
        setStudents(studentsWithRolesAndScores);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
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

  const handleStudentClick = (student) => {
    console.log('Клик по студенту:', student);
    console.log('Переход на профиль с ID:', student.user_id);
    if (student && student.user_id) {
      navigate(`/profile/${student.user_id}`);
    } else {
      console.error('Нет user_id для перехода');
      alert('Не удалось открыть профиль');
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  };

  const getRandomColor = (id) => {
    const colors = [
      '#667eea',
      '#764ba2',
      '#f56565',
      '#48bb78',
      '#4299e1',
      '#ed8936',
      '#9f7aea',
      '#f687b3',
      '#4fd1c5',
      '#fbbf24',
    ];
    const index = id ? id % colors.length : 0;
    return colors[index];
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Организатор':
        return 'role-organizer';
      case 'Куратор':
        return 'role-tutor';
      default:
        return 'role-projectant';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'Организатор':
        return 'Организатор';
      case 'Куратор':
        return 'Куратор';
      default:
        return 'Проектант';
    }
  };

  const getScoreColor = (score) => {
    if (score === null) return '#cbd5e0';
    if (score >= 2 && score <= 3) return '#48bb78';
    if (score >= 0 && score < 2) return '#ed8936';
    if (score >= -1 && score < 0) return '#f56565';
    return '#cbd5e0';
  };

  const projectantStudents = students.filter(
    s => (s.role || 'Проектант') === 'Проектант'
  );

  const allTeams = [
    ...new Set(
      projectantStudents.map(s => s.teamName).filter(Boolean)
    ),
  ].sort();

  const includeNoTeam = projectantStudents.some(
    s => s.teamName === 'Без команды'
  );

  const handleTeamFilterChange = (e) => {
    setSelectedTeamFilter(e.target.value);
  };

  const filteredStudents = projectantStudents
    .filter(student => {
      const fullName = (student.full_name || '').toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());

      const matchesTeam =
        selectedTeamFilter === 'all' ||
        selectedTeamFilter === 'Без команды' && student.teamName === 'Без команды' ||
        student.teamName === selectedTeamFilter;

      return matchesSearch && matchesTeam;
    });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue, bValue;

    if (sortBy === 'name') {
      aValue = a.full_name || '';
      bValue = b.full_name || '';
    } else if (sortBy === 'lastName') {
      aValue = a.last_name || '';
      bValue = b.last_name || '';
    } else if (sortBy === 'firstName') {
      aValue = a.first_name || '';
      bValue = b.first_name || '';
    } else if (sortBy === 'role') {
      aValue = a.role || 'Проектант';
      bValue = b.role || 'Проектант';
    } else if (sortBy === 'averageScore') {
      aValue = a.averageScore !== null ? a.averageScore : -1;
      bValue = b.averageScore !== null ? b.averageScore : -1;
    } else if (sortBy === 'teamName') {
      aValue = a.teamName || 'Без команды';
      bValue = b.teamName || 'Без команды';
    } else {
      aValue = a.user_id;
      bValue = b.user_id;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) return <div className="loading">Загрузка студентов…</div>;

  return (
    <div className="list-student-container">
      <Header onLogout={handleLogout} user={currentUser} />

      <div className="list-student-content">
        <div className="list-student-header">
          <h1>Список проектантов</h1>
          <div className="student-stats">
            <span className="stats-badge">
              Всего:{' '}
              {students.filter(s => (s.role || 'Проектант') === 'Проектант').length}
            </span>
            <span className="stats-badge">👥 Только проектанты</span>
          </div>
        </div>

        <div className="search-filter-section">
          <div className="search-box">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Поиск по имени или фамилии…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                ×
              </button>
            )}
          </div>

          {/* === Фильтр по командам (выпадающий список) === */}
          <div className="team-filter-section">
            <select
              value={selectedTeamFilter}
              onChange={handleTeamFilterChange}
              className="team-select"
            >
              <option value="all">Все команды</option>
              {allTeams.map(teamName => (
                <option key={teamName} value={teamName}>
                  {teamName}
                </option>
              ))}
              {includeNoTeam && (
                <option key="Без команды" value="Без команды">
                  Без команды
                </option>
              )}
            </select>
          </div>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th className="col-number">#</th>
                <th className="col-avatar">Фото</th>
                <th
                  className={`col-name ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  ФИО
                  {sortBy === 'name' && (
                    <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className={`col-lastname ${sortBy === 'lastName' ? 'active' : ''}`}
                  onClick={() => handleSort('lastName')}
                >
                  Фамилия
                  {sortBy === 'lastName' && (
                    <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className={`col-firstname ${sortBy === 'firstName' ? 'active' : ''}`}
                  onClick={() => handleSort('firstName')}
                >
                  Имя
                  {sortBy === 'firstName' && (
                    <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className={`col-role ${sortBy === 'role' ? 'active' : ''}`}
                  onClick={() => handleSort('role')}
                >
                  Роль
                  {sortBy === 'role' && (
                    <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className={`col-team ${sortBy === 'teamName' ? 'active' : ''}`}
                  onClick={() => handleSort('teamName')}
                >
                  Команда
                  {sortBy === 'teamName' && (
                    <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className={`col-score ${sortBy === 'averageScore' ? 'active' : ''}`}
                  onClick={() => handleSort('averageScore')}
                >
                  Средний балл (-1…3)
                  {sortBy === 'averageScore' && (
                    <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <p>Проектанты не найдены</p>
                    <span className="empty-subtext">Попробуйте изменить параметры поиска</span>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className="student-row"
                    onClick={() => handleStudentClick(student)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="col-number">
                      <span className="number-badge">{index + 1}</span>
                    </td>
                    <td className="col-avatar">
                      <div
                        className="student-avatar"
                        style={{ backgroundColor: getRandomColor(student.user_id) }}
                      >
                        {getInitials(student.full_name)}
                      </div>
                    </td>
                    <td className="col-name">
                      <span className="full-name">{student.full_name}</span>
                    </td>
                    <td className="col-lastname">{student.last_name || '—'}</td>
                    <td className="col-firstname">{student.first_name || '—'}</td>
                    <td className="col-role">
                      <span
                        className={`role-badge ${getRoleBadgeClass(student.role || 'Проектант')}`}
                      >
                        {getRoleName(student.role || 'Проектант')}
                      </span>
                    </td>
                    <td className="col-team">{student.teamName}</td>
                    <td className="col-score">
                      {student.averageScore !== null ? (
                        <span
                          className="score-badge"
                          style={{
                            backgroundColor: getScoreColor(student.averageScore),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'inline-block',
                          }}
                        >
                          {student.averageScore.toFixed(1)}
                        </span>
                      ) : (
                        <span
                          className="score-badge no-score"
                          style={{
                            backgroundColor: '#cbd5e0',
                            color: '#666',
                            padding: '4px 8px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'inline-block',
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 0 && (
          <div className="table-footer">
            <span className="showing-info">
              Показано {filteredStudents.length} из{' '}
              {students.filter(s => (s.role || 'Проектант') === 'Проектант').length} проектантов
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListStudent;