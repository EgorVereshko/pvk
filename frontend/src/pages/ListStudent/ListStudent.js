import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './ListStudent.css';

const mockStudents = [
  {
    id: 1,
    last_name: 'Иванов',
    first_name: 'Иван',
    middle_name: 'Иванович',
    email: 'ivanov@example.com',
    phone_number: '+7 (999) 123-45-67',
    university: 'МГУ',
    year_of_study: '4',
    photo_url: null
  },
  {
    id: 2,
    last_name: 'Петрова',
    first_name: 'Анна',
    middle_name: 'Сергеевна',
    email: 'petrova@example.com',
    phone_number: '+7 (999) 234-56-78',
    university: 'СПбГУ',
    year_of_study: '3',
    photo_url: null
  },
  {
    id: 3,
    last_name: 'Сидоров',
    first_name: 'Алексей',
    middle_name: 'Владимирович',
    email: 'sidorov@example.com',
    phone_number: '+7 (999) 345-67-89',
    university: 'МФТИ',
    year_of_study: '4',
    photo_url: null
  },
  {
    id: 4,
    last_name: 'Козлова',
    first_name: 'Екатерина',
    middle_name: 'Дмитриевна',
    email: 'kozlova@example.com',
    phone_number: '+7 (999) 456-78-90',
    university: 'ВШЭ',
    year_of_study: '2',
    photo_url: null
  },
  {
    id: 5,
    last_name: 'Морозов',
    first_name: 'Дмитрий',
    middle_name: 'Андреевич',
    email: 'morozov@example.com',
    phone_number: '+7 (999) 567-89-01',
    university: 'МГТУ',
    year_of_study: '4',
    photo_url: null
  },
  {
    id: 6,
    last_name: 'Волкова',
    first_name: 'Ольга',
    middle_name: 'Алексеевна',
    email: 'volkova@example.com',
    phone_number: '+7 (999) 678-90-12',
    university: 'РУДН',
    year_of_study: '3',
    photo_url: null
  },
  {
    id: 7,
    last_name: 'Соколов',
    first_name: 'Павел',
    middle_name: 'Николаевич',
    email: 'sokolov@example.com',
    phone_number: '+7 (999) 789-01-23',
    university: 'МИФИ',
    year_of_study: '4',
    photo_url: null
  },
  {
    id: 8,
    last_name: 'Кузнецова',
    first_name: 'Мария',
    middle_name: 'Игоревна',
    email: 'kuznetsova@example.com',
    phone_number: '+7 (999) 890-12-34',
    university: 'МПГУ',
    year_of_study: '2',
    photo_url: null
  }
];

const ListStudent = () => {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [useMockData, setUseMockData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchStudents();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/by-role/', {
        params: { role: 'Проектант' }
      });
      
      if (response.data && response.data.length > 0) {
        setStudents(response.data);
        setUseMockData(false);
      } else {
        setStudents(mockStudents);
        setUseMockData(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки студентов из бэкенда:', error);
      setStudents(mockStudents);
      setUseMockData(true);
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
    navigate(`/student/${student.id}`, { state: { student } });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRandomColor = (id) => {
    const colors = [
      '#667eea', '#764ba2', '#f56565', '#48bb78', '#4299e1', 
      '#ed8936', '#9f7aea', '#f687b3', '#4fd1c5', '#fbbf24'
    ];
    return colors[(id - 1) % colors.length];
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.last_name || ''} ${student.first_name || ''} ${student.middle_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue, bValue;
    
    if (sortBy === 'name') {
      aValue = `${a.last_name} ${a.first_name}`;
      bValue = `${b.last_name} ${b.first_name}`;
    } else if (sortBy === 'lastName') {
      aValue = a.last_name;
      bValue = b.last_name;
    } else if (sortBy === 'firstName') {
      aValue = a.first_name;
      bValue = b.first_name;
    } else {
      aValue = a.id;
      bValue = b.id;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) return <div className="loading">Загрузка студентов...</div>;

  return (
    <div className="list-student-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="list-student-content">
        <div className="list-student-header">
          <h1>Список студентов</h1>
          <div className="student-stats">
            <span className="stats-badge">
              Всего: {students.length}
            </span>
            <span className="stats-badge">
              👨‍🎓 Проектанты
            </span>
            {useMockData && (
              <span className="stats-badge demo-badge">
                📋 Демо-данные
              </span>
            )}
          </div>
        </div>

        <div className="search-filter-section">
          <div className="search-box">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по имени или фамилии..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
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
                <th className="col-id">ID</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p>Студенты не найдены</p>
                    <span className="empty-subtext">Попробуйте изменить параметры поиска</span>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="student-row"
                    onClick={() => handleStudentClick(student)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="col-avatar">
                      {student.photo_url ? (
                        <img 
                          src={student.photo_url} 
                          alt={`${student.first_name} ${student.last_name}`}
                          className="student-avatar-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="student-avatar" style="background-color: ${getRandomColor(student.id)}">
                                  ${getInitials(student.first_name, student.last_name)}
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="student-avatar" style={{ backgroundColor: getRandomColor(student.id) }}>
                          {getInitials(student.first_name, student.last_name)}
                        </div>
                      )}
                    </td>
                    <td className="col-name">
                      <span className="full-name">
                        {student.last_name} {student.first_name} {student.middle_name || ''}
                      </span>
                    </td>
                    <td className="col-lastname">{student.last_name}</td>
                    <td className="col-firstname">{student.first_name}</td>
                    <td className="col-id">
                      <span className="id-badge">#{student.id}</span>
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
              Показано {filteredStudents.length} из {students.length} студентов
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListStudent;