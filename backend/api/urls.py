from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import *

urlpatterns = [
    # Аутентификация
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # получить профиль текущего пользователя
    path('api/user/', get_user, name='get_current_user'),
    path('api/students/', get_students, name='get_students'),
    # получить профиль по id (чтобы организатор мог получить профиль конкретного проектанта)
    path('api/user/<int:user_id>/', get_user, name='get_user_by_id'),
    path('api/user/update/', update_user, name='update_user'),

    # Текущие оценки (для лепестковой диаграммы)
    path('api/latest_qualities_scores/', get_latest_qualities_scores, name='get_latest_qualities_scores'),
    path('api/latest_qualities_scores/<int:user_id>/', get_latest_qualities_scores, name='get_latest_qualities_scores_by_id'),

    path('api/qualities_stats/<int:user_id>/', get_qualities_stats, name='get_qualities_stats'),
    path('api/qualities_scores/<int:user_id>/<int:model_id>/', get_qualities_scores_for_model, name='get_qualities_scores_for_model'),
    path('api/scores_history/<int:user_id>/', get_all_scores_history, name='get_all_scores_history'),
    path('api/scores/recalculate_all/', recalculate_all_models_scores, name='recalculate_all_models_scores'),

    # Оценки компетенций
    path('api/competences/scores/', save_competences_scores, name='save_competences_scores'),

    # Команды
    path('api/teams/', get_teams, name='get_teams'),
    path('api/teams/<int:team_id>/member-count/', get_team_member_count, name='get_team_member_count'),
    path('api/teams/<int:team_id>/members/', get_team_members, name='get_team_members'),

    # Индикаторы
    # path('api/indicators/', get_indicators, name='get_indicators'),
    # path('api/assessment_models/', get_assessment_models, name='get_assessment_models'),

    # Шаблоны индикаторов
    path('api/templates/', get_templates, name='get_templates'),
    path('api/templates/create/', create_template, name='save_template'),
    path('api/templates/<int:template_id>/', get_template_detail, name='get_template_detail'),
    path('api/templates/<int:template_id>/update/', update_template, name='update_template'),
    path('api/templates/delete/<int:template_id>/', delete_template, name='delete_template'),
    
    # Оценочные формы (мероприятия)
    path('api/forms/create/', create_form, name='create_assessment_form'),
    path('api/forms/update/<int:form_id>/', update_form, name='create_assessment_form'),
    path('api/forms/delete/<int:form_id>/', delete_form, name='create_assessment_form'),
    # списки форм для проектанта
    path('api/forms/projectant/', get_projectant_forms, name='get_projectant_forms'),
    # для куратора
    path('api/forms/tutor/', get_tutor_forms, name='get_tutor_forms'),
    # для организатора
    path('api/forms/all/', get_all_forms, name='get_all_forms'),
    # отдельные формы
    # подробная инфа о форме для куратора или организатора, чтобы открыть и посмотреть/отредактировать/удалить
    path('api/forms/detailed/', get_form_detailed, name='get_form_detailed'),
    # для заполнения формы (подстраивается под тип формы)
    path('api/forms/fill/<int:form_id>/', get_form_to_fill, name='get_360'),
    # получение данных форм
    path('api/forms/submit/360', submit_360_form, name='submit_360'),
    path('api/forms/submit/check_list', submit_check_list_form, name='submit_check_list'),
    path('api/forms/submit/poll', submit_poll_form, name='submit_poll'),
    path('api/forms/<int:form_id>/completed-students/', get_form_completed_students, name='get_form_completed_students'),
    path('api/forms/<int:form_id>/check-complete/', check_and_complete_form, name='check_and_complete_form'),
    path('api/forms/detailed/<int:form_id>/', get_form_detailed, name='get_form_detailed'),

    # Качества и индикаторы
    path('api/qualities/', get_qualities_list, name='get_qualities_list'),
    path('api/qualities/', get_qualities_list, name='get_qualities_list'),
    path('api/qualities/create/', create_quality, name='create_quality'),
    path('api/qualities/<int:quality_id>/update/', update_quality, name='update_quality'),
    path('api/qualities/<int:quality_id>/delete/', delete_quality, name='delete_quality'),
    path('api/indicators/', get_indicators_list, name='get_indicators_list'),
    path('api/indicator_scores/<int:form_id>/<int:user_id>/', get_indicator_scores, name='get_indicator_scores'),
    
    # Модели оценивания (новые эндпоинты)
    path('api/assessment_models/', get_assessment_models_list, name='get_assessment_models_list'),
    path('api/assessment_models/create', create_assessment_model_view, name='create_assessment_model'),
    path('api/assessment_models/update', update_assessment_model_view, name='update_assessment_model'),
    path('api/assessment_models/delete', delete_assessment_model_view, name='delete_assessment_model'),
    path('api/assessment_models/set_active/', set_active_model_view, name='set_active_model'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)