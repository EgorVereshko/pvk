import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../Header/Header';
import './ListStudent.css';

const ListStudent = () => {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
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
      const response = await api.get('/api/students/');
      setStudents(response.data);
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
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

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRandomColor = (id) => {
    const colors = [
      '#667eea', '#764ba2', '#f56565', '#48bb78', '#4299e1', 
      '#ed8936', '#9f7aea', '#f687b3', '#4fd1c5', '#fbbf24'
    ];
    return colors[id % colors.length];
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.last_name} ${student.first_name} ${student.middle_name}`.toLowerCase();
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

  if (loading) return <div className="loading">Загрузка...</div>;

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
                sortedStudents.map((student, index) => (
                  <tr key={student.id} className="student-row">
                    <td className="col-avatar">
                      <div 
                        className="student-avatar"
                        style={{ backgroundColor: getRandomColor(student.id) }}
                      >
                        {getInitials(student.first_name, student.last_name)}
                      </div>
                    </td>
                    <td className="col-name">
                      <span className="full-name">
                        {student.last_name} {student.first_name} {student.middle_name}
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