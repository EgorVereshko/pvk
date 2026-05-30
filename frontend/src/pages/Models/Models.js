// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import api from '../../api';
// import Header from '../../components/Header/Header';
// import './Models.css';

// const Models = () => {
//   const { user, logout, isOrganizer } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [models, setModels] = useState([]);
//   const [allQualities, setAllQualities] = useState([]);
//   const [allIndicators, setAllIndicators] = useState([]);
//   const [selectedModel, setSelectedModel] = useState(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [activeModelId, setActiveModelId] = useState(null);
  
//   const [formData, setFormData] = useState({
//     name: '',
//     qualities_indicators_ratios: []
//   });
  
//   const [newRatio, setNewRatio] = useState({
//     quality_id: '',
//     indicator_id: '',
//     ratio: 0.0
//   });
  
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!isOrganizer()) {
//       alert('Доступ запрещен. Только для организаторов');
//       navigate('/profile');
//     }
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       const [modelsRes, qualitiesRes, indicatorsRes] = await Promise.all([
//         api.get('/api/assessment_models/'),
//         api.get('/api/qualities/'),
//         api.get('/api/indicators/')
//       ]);
//       setModels(modelsRes.data);
//       setAllQualities(qualitiesRes.data);
//       setAllIndicators(indicatorsRes.data);
      
//       // Находим активную модель
//       const active = modelsRes.data.find(m => m.status === 'Активная');
//       if (active) {
//         setActiveModelId(active.id);
//       }
//     } catch (error) {
//       console.error('Ошибка загрузки:', error);
//       alert('Ошибка загрузки данных');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getQualityName = (qualityId) => {
//     const quality = allQualities.find(q => q.id === qualityId);
//     return quality ? quality.name : 'Неизвестно';
//   };

//   const getIndicatorName = (indicatorId) => {
//     const indicator = allIndicators.find(i => i.id === indicatorId);
//     return indicator ? indicator.name : 'Неизвестно';
//   };

//   const handleCreateModel = async () => {
//     if (!formData.name) {
//       alert('Введите название модели');
//       return;
//     }
    
//     if (formData.qualities_indicators_ratios.length === 0) {
//       alert('Добавьте хотя бы одну связь качества и индикатора');
//       return;
//     }
    
//     try {
//       await api.post('/api/assessment_models/create', {
//         name: formData.name,
//         qualities_indicators_ratios: formData.qualities_indicators_ratios
//       });
      
//       alert('Модель успешно создана');
//       setShowCreateModal(false);
//       resetForm();
//       loadData();
//     } catch (error) {
//       console.error('Ошибка создания:', error);
//       alert('Ошибка при создании модели');
//     }
//   };

//   const handleUpdateModel = async () => {
//     if (!formData.name) {
//       alert('Введите название модели');
//       return;
//     }
    
//     try {
//       await api.post('/api/assessment_models/update', {
//         model_id: selectedModel.id,
//         qualities_indicators_ratios: formData.qualities_indicators_ratios
//       });
      
//       alert('Модель успешно обновлена');
//       setShowEditModal(false);
//       resetForm();
//       loadData();
//     } catch (error) {
//       console.error('Ошибка обновления:', error);
//       alert('Ошибка при обновлении модели');
//     }
//   };

//   const handleDeleteModel = async (modelId, modelName) => {
//     if (models.length === 1) {
//       alert('Нельзя удалить единственную модель оценивания');
//       return;
//     }
    
//     if (window.confirm(`Вы уверены, что хотите удалить модель "${modelName}"?`)) {
//       try {
//         await api.post('/api/assessment_models/delete', { model_id: modelId });
//         alert('Модель удалена');
//         loadData();
//       } catch (error) {
//         console.error('Ошибка удаления:', error);
//         alert('Ошибка при удалении модели');
//       }
//     }
//   };

//   const handleSetActiveModel = async (modelId) => {
//     if (window.confirm('Установить эту модель как активную? Все оценки будут пересчитаны.')) {
//       try {
//         await api.post('/api/assessment_models/set_active/', { model_id: modelId });
//         alert('Активная модель изменена');
//         loadData();
//       } catch (error) {
//         console.error('Ошибка:', error);
//         alert('Ошибка при установке активной модели');
//       }
//     }
//   };

//   const addRatio = () => {
//     if (!newRatio.quality_id) {
//       alert('Выберите качество');
//       return;
//     }
//     if (!newRatio.indicator_id) {
//       alert('Выберите индикатор');
//       return;
//     }
//     if (newRatio.ratio <= 0 || newRatio.ratio > 1) {
//       alert('Коэффициент должен быть от 0 до 1');
//       return;
//     }
    
//     // Проверка на дубликат
//     const exists = formData.qualities_indicators_ratios.some(
//       item => item.quality_id === parseInt(newRatio.quality_id) && 
//                item.indicator_id === parseInt(newRatio.indicator_id)
//     );
    
//     if (exists) {
//       alert('Такая связь уже существует');
//       return;
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       qualities_indicators_ratios: [
//         ...prev.qualities_indicators_ratios,
//         {
//           quality_id: parseInt(newRatio.quality_id),
//           indicator_id: parseInt(newRatio.indicator_id),
//           ratio: parseFloat(newRatio.ratio)
//         }
//       ]
//     }));
    
//     setNewRatio({ quality_id: '', indicator_id: '', ratio: 0.0 });
//   };

//   const removeRatio = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       qualities_indicators_ratios: prev.qualities_indicators_ratios.filter((_, i) => i !== index)
//     }));
//   };

//   const openEditModal = (model) => {
//     setSelectedModel(model);
//     setFormData({
//       name: model.name,
//       qualities_indicators_ratios: model.qualities_indicators_ratios || []
//     });
//     setShowEditModal(true);
//   };

//   const resetForm = () => {
//     setFormData({
//       name: '',
//       qualities_indicators_ratios: []
//     });
//     setNewRatio({ quality_id: '', indicator_id: '', ratio: 0.0 });
//   };

//   // Группировка связей по качествам для отображения
//   const getRatiosByQuality = (ratios) => {
//     const grouped = {};
//     ratios.forEach(ratio => {
//       if (!grouped[ratio.quality_id]) {
//         grouped[ratio.quality_id] = [];
//       }
//       grouped[ratio.quality_id].push(ratio);
//     });
//     return grouped;
//   };

//   if (loading) return <div className="loading">Загрузка...</div>;

//   return (
//     <div className="models-container">
//       <Header onLogout={logout} user={user} />
      
//       <div className="models-content">
//         <div className="models-header">
//           <h1>Модели оценивания</h1>
//           <button className="create-btn" onClick={() => setShowCreateModal(true)}>
//             + Создать модель
//           </button>
//         </div>
        
//         <div className="models-list">
//           {models.length === 0 ? (
//             <div className="empty-state">
//               <p>Нет созданных моделей</p>
//               <button onClick={() => setShowCreateModal(true)}>Создать первую модель</button>
//             </div>
//           ) : (
//             models.map(model => {
//               const groupedRatios = getRatiosByQuality(model.qualities_indicators_ratios || []);
//               const isActive = model.status === 'Активная';
              
//               return (
//                 <div key={model.id} className={`model-card ${isActive ? 'active' : ''}`}>
//                   <div className="model-header">
//                     <div className="model-title">
//                       <h3>{model.name}</h3>
//                       {isActive && <span className="active-badge">Активна</span>}
//                     </div>
//                     <div className="model-actions">
//                       <button 
//                         className="edit-btn"
//                         onClick={() => openEditModal(model)}
//                         title="Редактировать"
//                       >
//                         ✏️
//                       </button>
//                       <button 
//                         className="delete-btn"
//                         onClick={() => handleDeleteModel(model.id, model.name)}
//                         title="Удалить"
//                         disabled={models.length === 1}
//                       >
//                         🗑️
//                       </button>
//                       {!isActive && (
//                         <button 
//                           className="activate-btn"
//                           onClick={() => handleSetActiveModel(model.id)}
//                           title="Сделать активной"
//                         >
//                           ✓ Активировать
//                         </button>
//                       )}
//                     </div>
//                   </div>
                  
//                   <div className="model-body">
//                     <table className="ratios-table">
//                       <thead>
//                         <tr>
//                           <th>Качество</th>
//                           <th>Индикатор</th>
//                           <th>Коэффициент</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {Object.entries(groupedRatios).map(([qualityId, ratios]) => {
//                           const qualityName = getQualityName(parseInt(qualityId));
//                           const rowSpan = ratios.length;
                          
//                           return ratios.map((ratio, idx) => (
//                             <tr key={`${qualityId}-${ratio.indicator_id}`}>
//                               {idx === 0 && (
//                                 <td rowSpan={rowSpan} className="quality-cell">
//                                   <strong>{qualityName}</strong>
//                                 </td>
//                               )}
//                               <td>{getIndicatorName(ratio.indicator_id)}</td>
//                               <td className="ratio-cell">{ratio.ratio}</td>
//                             </tr>
//                           ));
//                         })}
//                         {Object.keys(groupedRatios).length === 0 && (
//                           <tr>
//                             <td colSpan="3" className="empty-ratios">
//                               Нет настроенных связей
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
      
//       {/* Модальное окно создания модели */}
//       {showCreateModal && (
//         <div className="modal-overlay">
//           <div className="modal-content large">
//             <h2>Создание модели оценивания</h2>
            
//             <div className="form-group">
//               <label>Название модели *</label>
//               <input
//                 type="text"
//                 value={formData.name}
//                 onChange={(e) => setFormData({...formData, name: e.target.value})}
//                 placeholder="Например: Модель ПВК 2026"
//               />
//             </div>
            
//             <div className="ratios-section">
//               <h3>Связи качеств и индикаторов</h3>
//               <p className="hint">Определите, какие индикаторы влияют на какие качества, и с каким весом (сумма по качеству = 1)</p>
              
//               <div className="add-ratio-row">
//                 <select
//                   value={newRatio.quality_id}
//                   onChange={(e) => setNewRatio({...newRatio, quality_id: e.target.value})}
//                 >
//                   <option value="">Выберите качество</option>
//                   {allQualities.map(quality => (
//                     <option key={quality.id} value={quality.id}>{quality.name}</option>
//                   ))}
//                 </select>
                
//                 <select
//                   value={newRatio.indicator_id}
//                   onChange={(e) => setNewRatio({...newRatio, indicator_id: e.target.value})}
//                 >
//                   <option value="">Выберите индикатор</option>
//                   {allIndicators.map(indicator => (
//                     <option key={indicator.id} value={indicator.id}>{indicator.name}</option>
//                   ))}
//                 </select>
                
//                 <input
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   max="1"
//                   value={newRatio.ratio}
//                   onChange={(e) => setNewRatio({...newRatio, ratio: parseFloat(e.target.value)})}
//                   placeholder="Коэффициент (0-1)"
//                 />
                
//                 <button className="add-btn" onClick={addRatio}>+ Добавить</button>
//               </div>
              
//               <div className="ratios-list">
//                 <table className="ratios-table-editor">
//                   <thead>
//                     <tr>
//                       <th>Качество</th>
//                       <th>Индикатор</th>
//                       <th>Коэффициент</th>
//                       <th></th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {formData.qualities_indicators_ratios.map((item, idx) => (
//                       <tr key={idx}>
//                         <td>{getQualityName(item.quality_id)}</td>
//                         <td>{getIndicatorName(item.indicator_id)}</td>
//                         <td>{item.ratio}</td>
//                         <td>
//                           <button className="remove-btn" onClick={() => removeRatio(idx)}>×</button>
//                         </td>
//                       </tr>
//                     ))}
//                     {formData.qualities_indicators_ratios.length === 0 && (
//                       <tr>
//                         <td colSpan="4" className="empty-ratios">Нет добавленных связей</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
            
//             <div className="modal-actions">
//               <button className="cancel-btn" onClick={() => {
//                 setShowCreateModal(false);
//                 resetForm();
//               }}>Отмена</button>
//               <button className="save-btn" onClick={handleCreateModel}>Создать модель</button>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Модальное окно редактирования модели */}
//       {showEditModal && selectedModel && (
//         <div className="modal-overlay">
//           <div className="modal-content large">
//             <h2>Редактирование модели: {selectedModel.name}</h2>
            
//             <div className="form-group">
//               <label>Название модели *</label>
//               <input
//                 type="text"
//                 value={formData.name}
//                 onChange={(e) => setFormData({...formData, name: e.target.value})}
//                 placeholder="Название модели"
//               />
//             </div>
            
//             <div className="ratios-section">
//               <h3>Связи качеств и индикаторов</h3>
//               <p className="hint">Добавьте или удалите связи</p>
              
//               <div className="add-ratio-row">
//                 <select
//                   value={newRatio.quality_id}
//                   onChange={(e) => setNewRatio({...newRatio, quality_id: e.target.value})}
//                 >
//                   <option value="">Выберите качество</option>
//                   {allQualities.map(quality => (
//                     <option key={quality.id} value={quality.id}>{quality.name}</option>
//                   ))}
//                 </select>
                
//                 <select
//                   value={newRatio.indicator_id}
//                   onChange={(e) => setNewRatio({...newRatio, indicator_id: e.target.value})}
//                 >
//                   <option value="">Выберите индикатор</option>
//                   {allIndicators.map(indicator => (
//                     <option key={indicator.id} value={indicator.id}>{indicator.name}</option>
//                   ))}
//                 </select>
                
//                 <input
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   max="1"
//                   value={newRatio.ratio}
//                   onChange={(e) => setNewRatio({...newRatio, ratio: parseFloat(e.target.value)})}
//                   placeholder="Коэффициент (0-1)"
//                 />
                
//                 <button className="add-btn" onClick={addRatio}>+ Добавить</button>
//               </div>
              
//               <div className="ratios-list">
//                 <table className="ratios-table-editor">
//                   <thead>
//                     <tr>
//                       <th>Качество</th>
//                       <th>Индикатор</th>
//                       <th>Коэффициент</th>
//                       <th></th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {formData.qualities_indicators_ratios.map((item, idx) => (
//                       <tr key={idx}>
//                         <td>{getQualityName(item.quality_id)}</td>
//                         <td>{getIndicatorName(item.indicator_id)}</td>
//                         <td>{item.ratio}</td>
//                         <td>
//                           <button className="remove-btn" onClick={() => removeRatio(idx)}>×</button>
//                         </td>
//                       </tr>
//                     ))}
//                     {formData.qualities_indicators_ratios.length === 0 && (
//                       <tr>
//                         <td colSpan="4" className="empty-ratios">Нет добавленных связей</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
            
//             <div className="modal-actions">
//               <button className="cancel-btn" onClick={() => {
//                 setShowEditModal(false);
//                 resetForm();
//               }}>Отмена</button>
//               <button className="save-btn" onClick={handleUpdateModel}>Сохранить изменения</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Models;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import './Models.css';

const Models = () => {
  const { user, logout, isOrganizer } = useAuth();
  const [models, setModels] = useState([
    {
      id: 1,
      name: 'Модель ПВК 2026',
      status: 'Активная',
      qualities_indicators_ratios: [
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 1, indicator_name: 'Умение анализировать, выявлять существенное', ratio: 0.25 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 2, indicator_name: 'Воспроизведение по инструкции', ratio: 0.15 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 3, indicator_name: 'Реакция на критику (устное общение)', ratio: 0.20 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 4, indicator_name: 'Поведение в ситуации неопределенности', ratio: 0.15 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 5, indicator_name: 'Исправление ошибок', ratio: 0.10 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 6, indicator_name: 'Умение планировать (декомпозиция)', ratio: 0.10 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 7, indicator_name: 'Умение планировать (логика последовательности)', ratio: 0.05 },
        { quality_id: 2, quality_name: 'Вовлеченность', indicator_id: 1, indicator_name: 'Умение анализировать, выявлять существенное', ratio: 0.40 },
        { quality_id: 2, quality_name: 'Вовлеченность', indicator_id: 3, indicator_name: 'Реакция на критику (устное общение)', ratio: 0.30 },
        { quality_id: 2, quality_name: 'Вовлеченность', indicator_id: 8, indicator_name: 'Предупреждение о проблемах', ratio: 0.30 },
        { quality_id: 3, quality_name: 'Организованность', indicator_id: 6, indicator_name: 'Умение планировать (декомпозиция)', ratio: 0.25 },
        { quality_id: 3, quality_name: 'Организованность', indicator_id: 7, indicator_name: 'Умение планировать (логика последовательности)', ratio: 0.20 },
        { quality_id: 3, quality_name: 'Организованность', indicator_id: 8, indicator_name: 'Предупреждение о проблемах', ratio: 0.20 },
        { quality_id: 3, quality_name: 'Организованность', indicator_id: 9, indicator_name: 'Соблюдение сроков', ratio: 0.35 },
        { quality_id: 4, quality_name: 'Работа в команде', indicator_id: 8, indicator_name: 'Предупреждение о проблемах', ratio: 0.30 },
        { quality_id: 4, quality_name: 'Работа в команде', indicator_id: 10, indicator_name: 'Вклад во взаимосвязанную задачу', ratio: 0.70 }
      ]
    },
    {
      id: 2,
      name: 'Модель ПВК 2025 (архив)',
      status: 'Неактивная',
      qualities_indicators_ratios: [
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 1, indicator_name: 'Умение анализировать, выявлять существенное', ratio: 0.30 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 2, indicator_name: 'Воспроизведение по инструкции', ratio: 0.20 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 3, indicator_name: 'Реакция на критику (устное общение)', ratio: 0.25 },
        { quality_id: 1, quality_name: 'Обучаемость', indicator_id: 4, indicator_name: 'Поведение в ситуации неопределенности', ratio: 0.25 },
        { quality_id: 2, quality_name: 'Вовлеченность', indicator_id: 1, indicator_name: 'Умение анализировать, выявлять существенное', ratio: 0.50 },
        { quality_id: 2, quality_name: 'Вовлеченность', indicator_id: 8, indicator_name: 'Предупреждение о проблемах', ratio: 0.50 },
        { quality_id: 3, quality_name: 'Организованность', indicator_id: 9, indicator_name: 'Соблюдение сроков', ratio: 0.50 },
        { quality_id: 3, quality_name: 'Организованность', indicator_id: 8, indicator_name: 'Предупреждение о проблемах', ratio: 0.50 },
        { quality_id: 4, quality_name: 'Работа в команде', indicator_id: 10, indicator_name: 'Вклад во взаимосвязанную задачу', ratio: 1.00 }
      ]
    }
  ]);
  
  const [allQualities] = useState([
    { id: 1, name: 'Обучаемость', description: 'Способность к обучению' },
    { id: 2, name: 'Вовлеченность', description: 'Активность в работе' },
    { id: 3, name: 'Организованность', description: 'Планирование и выполнение задач' },
    { id: 4, name: 'Работа в команде', description: 'Взаимодействие с коллегами' }
  ]);
  
  const [allIndicators] = useState([
    { id: 1, name: 'Умение анализировать, выявлять существенное' },
    { id: 2, name: 'Воспроизведение по инструкции' },
    { id: 3, name: 'Реакция на критику (устное общение)' },
    { id: 4, name: 'Поведение в ситуации неопределенности' },
    { id: 5, name: 'Исправление ошибок' },
    { id: 6, name: 'Умение планировать (декомпозиция)' },
    { id: 7, name: 'Умение планировать (логика последовательности)' },
    { id: 8, name: 'Предупреждение о проблемах' },
    { id: 9, name: 'Соблюдение сроков' },
    { id: 10, name: 'Вклад во взаимосвязанную задачу' }
  ]);
  
  const [selectedModel, setSelectedModel] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    qualities_indicators_ratios: []
  });
  
  const [newRatio, setNewRatio] = useState({
    quality_id: '',
    quality_name: '',
    indicator_id: '',
    indicator_name: '',
    ratio: 0.0
  });
  
  const navigate = useNavigate();

  // Проверка доступа
  if (!isOrganizer()) {
    alert('Доступ запрещен. Только для организаторов');
    navigate('/profile');
    return null;
  }

  const getQualityName = (qualityId) => {
    const quality = allQualities.find(q => q.id === parseInt(qualityId));
    return quality ? quality.name : 'Неизвестно';
  };

  const getIndicatorName = (indicatorId) => {
    const indicator = allIndicators.find(i => i.id === parseInt(indicatorId));
    return indicator ? indicator.name : 'Неизвестно';
  };

  const handleCreateModel = () => {
    if (!formData.name) {
      alert('Введите название модели');
      return;
    }
    
    if (formData.qualities_indicators_ratios.length === 0) {
      alert('Добавьте хотя бы одну связь качества и индикатора');
      return;
    }
    
    const newModel = {
      id: Math.max(...models.map(m => m.id), 0) + 1,
      name: formData.name,
      status: 'Неактивная',
      qualities_indicators_ratios: formData.qualities_indicators_ratios
    };
    
    setModels([...models, newModel]);
    alert('Модель успешно создана');
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdateModel = () => {
    if (!formData.name) {
      alert('Введите название модели');
      return;
    }
    
    const updatedModels = models.map(model => 
      model.id === selectedModel.id 
        ? { ...model, name: formData.name, qualities_indicators_ratios: formData.qualities_indicators_ratios }
        : model
    );
    
    setModels(updatedModels);
    alert('Модель успешно обновлена');
    setShowEditModal(false);
    resetForm();
  };

  const handleDeleteModel = (modelId, modelName) => {
    if (models.length === 1) {
      alert('Нельзя удалить единственную модель оценивания');
      return;
    }
    
    const modelToDelete = models.find(m => m.id === modelId);
    if (modelToDelete && modelToDelete.status === 'Активная') {
      alert('Нельзя удалить активную модель. Сначала сделайте активной другую модель.');
      return;
    }
    
    if (window.confirm(`Вы уверены, что хотите удалить модель "${modelName}"?`)) {
      setModels(models.filter(m => m.id !== modelId));
      alert('Модель удалена');
    }
  };

  const handleSetActiveModel = (modelId) => {
    if (window.confirm('Установить эту модель как активную? Это может повлиять на расчёт оценок.')) {
      const updatedModels = models.map(model => ({
        ...model,
        status: model.id === modelId ? 'Активная' : 'Неактивная'
      }));
      setModels(updatedModels);
      alert('Активная модель изменена');
    }
  };

  const addRatio = () => {
    if (!newRatio.quality_id) {
      alert('Выберите качество');
      return;
    }
    if (!newRatio.indicator_id) {
      alert('Выберите индикатор');
      return;
    }
    if (newRatio.ratio <= 0 || newRatio.ratio > 1) {
      alert('Коэффициент должен быть от 0 до 1');
      return;
    }
    
    const qualityName = getQualityName(newRatio.quality_id);
    const indicatorName = getIndicatorName(newRatio.indicator_id);
    
    // Проверка на дубликат
    const exists = formData.qualities_indicators_ratios.some(
      item => item.quality_id === parseInt(newRatio.quality_id) && 
               item.indicator_id === parseInt(newRatio.indicator_id)
    );
    
    if (exists) {
      alert('Такая связь уже существует');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      qualities_indicators_ratios: [
        ...prev.qualities_indicators_ratios,
        {
          quality_id: parseInt(newRatio.quality_id),
          quality_name: qualityName,
          indicator_id: parseInt(newRatio.indicator_id),
          indicator_name: indicatorName,
          ratio: parseFloat(newRatio.ratio)
        }
      ]
    }));
    
    setNewRatio({ quality_id: '', quality_name: '', indicator_id: '', indicator_name: '', ratio: 0.0 });
  };

  const removeRatio = (index) => {
    setFormData(prev => ({
      ...prev,
      qualities_indicators_ratios: prev.qualities_indicators_ratios.filter((_, i) => i !== index)
    }));
  };

  const openEditModal = (model) => {
    setSelectedModel(model);
    setFormData({
      name: model.name,
      qualities_indicators_ratios: [...model.qualities_indicators_ratios]
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      qualities_indicators_ratios: []
    });
    setNewRatio({ quality_id: '', quality_name: '', indicator_id: '', indicator_name: '', ratio: 0.0 });
  };

  // Группировка связей по качествам для отображения
  const getRatiosByQuality = (ratios) => {
    const grouped = {};
    ratios.forEach(ratio => {
      if (!grouped[ratio.quality_id]) {
        grouped[ratio.quality_id] = [];
      }
      grouped[ratio.quality_id].push(ratio);
    });
    return grouped;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="models-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="models-content">
        <div className="models-header">
          <h1>Модели оценивания</h1>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            + Создать модель
          </button>
        </div>
        
        <div className="models-list">
          {models.length === 0 ? (
            <div className="empty-state">
              <p>Нет созданных моделей</p>
              <button onClick={() => setShowCreateModal(true)}>Создать первую модель</button>
            </div>
          ) : (
            models.map(model => {
              const groupedRatios = getRatiosByQuality(model.qualities_indicators_ratios || []);
              const isActive = model.status === 'Активная';
              
              return (
                <div key={model.id} className={`model-card ${isActive ? 'active' : ''}`}>
                  <div className="model-header">
                    <div className="model-title">
                      <h3>{model.name}</h3>
                      {isActive && <span className="active-badge">Активна</span>}
                    </div>
                    <div className="model-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => openEditModal(model)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteModel(model.id, model.name)}
                        title="Удалить"
                        disabled={models.length === 1}
                      >
                        🗑️
                      </button>
                      {!isActive && (
                        <button 
                          className="activate-btn"
                          onClick={() => handleSetActiveModel(model.id)}
                          title="Сделать активной"
                        >
                          ✓ Активировать
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="model-body">
                    <table className="ratios-table">
                      <thead>
                        <tr>
                          <th>Качество</th>
                          <th>Индикатор</th>
                          <th>Коэффициент</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(groupedRatios).map(([qualityId, ratios]) => {
                          const qualityName = getQualityName(parseInt(qualityId));
                          const rowSpan = ratios.length;
                          
                          return ratios.map((ratio, idx) => (
                            <tr key={`${qualityId}-${ratio.indicator_id}`}>
                              {idx === 0 && (
                                <td rowSpan={rowSpan} className="quality-cell">
                                  <strong>{qualityName}</strong>
                                </td>
                              )}
                              <td>{ratio.indicator_name}</td>
                              <td className="ratio-cell">{ratio.ratio}</td>
                            </tr>
                          ));
                        })}
                        {Object.keys(groupedRatios).length === 0 && (
                          <tr>
                            <td colSpan="3" className="empty-ratios">
                              Нет настроенных связей
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Модальное окно создания модели */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Создание модели оценивания</h2>
            
            <div className="form-group">
              <label>Название модели *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Например: Модель ПВК 2026"
              />
            </div>
            
            <div className="ratios-section">
              <h3>Связи качеств и индикаторов</h3>
              <p className="hint">Определите, какие индикаторы влияют на какие качества, и с каким весом (сумма по качеству должна быть = 1)</p>
              
              <div className="add-ratio-row">
                <select
                  value={newRatio.quality_id}
                  onChange={(e) => {
                    const qualityId = e.target.value;
                    setNewRatio({...newRatio, quality_id: qualityId});
                  }}
                >
                  <option value="">Выберите качество</option>
                  {allQualities.map(quality => (
                    <option key={quality.id} value={quality.id}>{quality.name}</option>
                  ))}
                </select>
                
                <select
                  value={newRatio.indicator_id}
                  onChange={(e) => {
                    const indicatorId = e.target.value;
                    setNewRatio({...newRatio, indicator_id: indicatorId});
                  }}
                >
                  <option value="">Выберите индикатор</option>
                  {allIndicators.map(indicator => (
                    <option key={indicator.id} value={indicator.id}>{indicator.name}</option>
                  ))}
                </select>
                
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={newRatio.ratio}
                  onChange={(e) => setNewRatio({...newRatio, ratio: parseFloat(e.target.value)})}
                  placeholder="Коэффициент (0-1)"
                />
                
                <button className="add-btn" onClick={addRatio}>+ Добавить</button>
              </div>
              
              <div className="ratios-list">
                <table className="ratios-table-editor">
                  <thead>
                    <tr>
                      <th>Качество</th>
                      <th>Индикатор</th>
                      <th>Коэффициент</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.qualities_indicators_ratios.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.quality_name}</td>
                        <td>{item.indicator_name}</td>
                        <td>{item.ratio}</td>
                        <td>
                          <button className="remove-btn" onClick={() => removeRatio(idx)}>×</button>
                        </td>
                      </tr>
                    ))}
                    {formData.qualities_indicators_ratios.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-ratios">Нет добавленных связей</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}>Отмена</button>
              <button className="save-btn" onClick={handleCreateModel}>Создать модель</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно редактирования модели */}
      {showEditModal && selectedModel && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Редактирование модели: {selectedModel.name}</h2>
            
            <div className="form-group">
              <label>Название модели *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Название модели"
              />
            </div>
            
            <div className="ratios-section">
              <h3>Связи качеств и индикаторов</h3>
              <p className="hint">Добавьте или удалите связи</p>
              
              <div className="add-ratio-row">
                <select
                  value={newRatio.quality_id}
                  onChange={(e) => setNewRatio({...newRatio, quality_id: e.target.value})}
                >
                  <option value="">Выберите качество</option>
                  {allQualities.map(quality => (
                    <option key={quality.id} value={quality.id}>{quality.name}</option>
                  ))}
                </select>
                
                <select
                  value={newRatio.indicator_id}
                  onChange={(e) => setNewRatio({...newRatio, indicator_id: e.target.value})}
                >
                  <option value="">Выберите индикатор</option>
                  {allIndicators.map(indicator => (
                    <option key={indicator.id} value={indicator.id}>{indicator.name}</option>
                  ))}
                </select>
                
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={newRatio.ratio}
                  onChange={(e) => setNewRatio({...newRatio, ratio: parseFloat(e.target.value)})}
                  placeholder="Коэффициент (0-1)"
                />
                
                <button className="add-btn" onClick={addRatio}>+ Добавить</button>
              </div>
              
              <div className="ratios-list">
                <table className="ratios-table-editor">
                  <thead>
                    <tr>
                      <th>Качество</th>
                      <th>Индикатор</th>
                      <th>Коэффициент</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.qualities_indicators_ratios.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.quality_name}</td>
                        <td>{item.indicator_name}</td>
                        <td>{item.ratio}</td>
                        <td>
                          <button className="remove-btn" onClick={() => removeRatio(idx)}>×</button>
                        </td>
                      </tr>
                    ))}
                    {formData.qualities_indicators_ratios.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-ratios">Нет добавленных связей</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}>Отмена</button>
              <button className="save-btn" onClick={handleUpdateModel}>Сохранить изменения</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Models;