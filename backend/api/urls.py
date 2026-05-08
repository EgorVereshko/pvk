from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import *

urlpatterns = [
    # path('api/student_events/', get_student_events, name='get_student_events'),
    # path('api/get_event_members/<int:event_id>/', get_event_members, name='get_team_members'),
    # path('api/record_assessment/', create_qualities_assessment, name='record_assessment'),
    # path('api/tutor_events/', get_tutor_events, name='get_student_events'),

    # Аутентификация
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Профиль пользователя
    # получить профиль текущего пользователя
    path('api/current_user/', get_user, name='get_current_user'),
    # получить профиль по id (чтобы организатор мог получить профиль конкретного проектанта)
    path('api/user/<int:user_id>/', get_user, name='get_user_by_id'),
    path('api/user/update/', update_user, name='update_user'),

    # Текущие оценки (для лепестковой диаграммы)
    path('api/latest_qualities_scores/', get_latest_qualities_scores, name='get_latest_qualities_scores'),
    path('api/latest_qualities_scores/<int:user_id>/', get_latest_qualities_scores,
         name='get_latest_qualities_scores_by_id'),
    # Оценки за 2 месяца (для динамики)
    path('api/qualities_stats/<int:user_id>/', get_qualities_stats, name='get_qualities_stats'),

    # Команды
    path('api/teams/', get_teams, name='get_teams'),

    # Индикаторы
    # path('api/indicators/', get_indicators, name='get_indicators'),

    path('api/assessment_models/', get_assessment_models, name='get_assessment_models'),

    # Шаблоны индикаторов
    path('api/templates/', get_templates, name='get_templates'),
    path('api/templates/create/', create_template, name='save_template'),
    path('api/templates/<int:template_id>/update/', update_template, name='update_template'),
    path('api/templates/delete/<int:template_id>/', delete_template, name='delete_template'),

    # Оценочные формы (мероприятия)
    path('api/forms/create/', create_form, name='create_assessment_form'),
    path('api/forms/update/<int:form_id>/', update_form, name='create_assessment_form'),
    path('api/forms/delete/<int:form_id>/', delete_form, name='create_assessment_form'),

    # списки форм
    # для проектанта
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

    path('api/forms/submit/360', submit_360_form, name='submit_360'),
    path('api/forms/submit/check_list', submit_check_list_form, name='submit_360'),
    path('api/forms/submit/poll', submit_poll_form, name='submit_360'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
