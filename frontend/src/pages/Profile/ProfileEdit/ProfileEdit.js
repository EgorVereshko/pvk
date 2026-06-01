// // ProfileEdit.js
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../api';
// import './ProfileEdit.css';

// const ProfileEdit = ({ user, onUpdate, onCancel }) => {
//   const [formData, setFormData] = useState({
//     last_name: '',
//     first_name: '',
//     middle_name: '',
//     phone_number: '',
//     telegram: '',
//     email: '',
//     vk: '',
//     university: '',
//     year_of_study: '',
//     description: ''
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [success, setSuccess] = useState(false);
  
//   useEffect(() => {
//     if (user) {
//       setFormData({
//         last_name: user.last_name || '',
//         first_name: user.first_name || '',
//         middle_name: user.middle_name || '',
//         phone_number: user.phone_number || '',
//         telegram: user.telegram || '',
//         email: user.email || '',
//         vk: user.vk || '',
//         university: user.university || '',
//         year_of_study: user.year_of_study || '',
//         description: user.description || ''
//       });
//     }
//   }, [user]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
    
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrors({});
    
//     try {
//       const response = await api.patch('/api/profile/update/', formData);
      
//       setSuccess(true);
//       setTimeout(() => {
//         if (onUpdate) {
//           onUpdate(response.data);
//         }
//         setSuccess(false);
//       }, 1500);
      
//     } catch (err) {
//       if (err.response?.data) {
//         setErrors(err.response.data);
//       } else {
//         setErrors({general: 'Ошибка при обновлении профиля'});
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="profile-edit-container">
//       <div className="profile-edit-card">
//         <h2>Редактирование профиля</h2>
        
//         {success && (
//           <div className="success-message">
//             Профиль успешно обновлен!
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="profile-edit-form">
//           <div className="form-row">
//             <div className="form-group">
//               <label>Фамилия *</label>
//               <input
//                 type="text"
//                 name="last_name"
//                 value={formData.last_name}
//                 onChange={handleChange}
//                 required
//                 className={errors.last_name ? 'error' : ''}
//               />
//               {errors.last_name && <span className="error-text">{errors.last_name}</span>}
//             </div>
            
//             <div className="form-group">
//               <label>Имя *</label>
//               <input
//                 type="text"
//                 name="first_name"
//                 value={formData.first_name}
//                 onChange={handleChange}
//                 required
//                 className={errors.first_name ? 'error' : ''}
//               />
//               {errors.first_name && <span className="error-text">{errors.first_name}</span>}
//             </div>
            
//             <div className="form-group">
//               <label>Отчество *</label>
//               <input
//                 type="text"
//                 name="middle_name"
//                 value={formData.middle_name}
//                 onChange={handleChange}
//                 required
//                 className={errors.middle_name ? 'error' : ''}
//               />
//               {errors.middle_name && <span className="error-text">{errors.middle_name}</span>}
//             </div>
//           </div>
          
//           <div className="form-row">
//             <div className="form-group">
//               <label>Телефон</label>
//               <input
//                 type="tel"
//                 name="phone_number"
//                 value={formData.phone_number}
//                 onChange={handleChange}
//                 placeholder="+7XXXXXXXXXX"
//               />
//             </div>
            
//             <div className="form-group">
//               <label>Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//               />
//               {errors.email && <span className="error-text">{errors.email}</span>}
//             </div>
//           </div>
          
//           <div className="form-row">
//             <div className="form-group">
//               <label>Telegram</label>
//               <input
//                 type="text"
//                 name="telegram"
//                 value={formData.telegram}
//                 onChange={handleChange}
//                 placeholder="@username"
//               />
//             </div>
            
//             <div className="form-group">
//               <label>ВКонтакте</label>
//               <input
//                 type="text"
//                 name="vk"
//                 value={formData.vk}
//                 onChange={handleChange}
//                 placeholder="vk.com/username"
//               />
//             </div>
//           </div>
          
//           <div className="form-row">
//             <div className="form-group">
//               <label>Университет</label>
//               <input
//                 type="text"
//                 name="university"
//                 value={formData.university}
//                 onChange={handleChange}
//               />
//             </div>
            
//             <div className="form-group">
//               <label>Курс</label>
//               <input
//                 type="text"
//                 name="year_of_study"
//                 value={formData.year_of_study}
//                 onChange={handleChange}
//                 placeholder="1, 2, 3, 4"
//               />
//             </div>
//           </div>
          
//           <div className="form-group">
//             <label>О себе</label>
//             <textarea
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               rows="4"
//               maxLength="2000"
//             />
//             <div className="char-count">
//               {formData.description.length}/2000 символов
//             </div>
//           </div>
          
//           {errors.general && (
//             <div className="error-message">{errors.general}</div>
//           )}
          
//           <div className="form-actions">
//             <button 
//               type="button" 
//               className="cancel-button"
//               onClick={onCancel}
//               disabled={loading}
//             >
//               Отмена
//             </button>
//             <button 
//               type="submit" 
//               className="save-button"
//               disabled={loading || success}
//             >
//               {loading ? 'Сохранение...' : success ? 'Сохранено!' : 'Сохранить'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ProfileEdit;