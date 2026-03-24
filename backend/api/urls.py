# from django.urls import path
# from django.conf import settings
# from django.conf.urls.static import static
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# from .views import RegisterView, get_profile, update_user, get_students, save_competences_scores

# urlpatterns = [
#     path('api/register/', RegisterView.as_view(), name='register'),
#     path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#     path('api/user/', get_profile, name='current_user'),
#     path('api/user/update/', update_user, name='update_user'),
#     path('api/students/', get_students, name='get_students'),
#     path('api/competences/scores/', save_competences_scores, name='save_competences_scores'),
# ]

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, get_profile, update_user, get_students, save_competences_scores,
    get_teams, get_templates, save_template, delete_template, save_checklist,
    get_checklists, create_event, create_indicators_list, get_indicators,
    update_template, get_events, get_checklist_detail, update_checklist, delete_checklist, get_user_scores,
    get_poll_templates, create_poll_template, get_poll_template_detail,
    update_poll_template, delete_poll_template,
    get_polls, create_poll, get_poll_detail, update_poll, delete_poll,
    get_poll_assignments, get_poll_by_link, submit_poll_response
)

urlpatterns = [
    # Аутентификация
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Профиль пользователя
    path('api/user/', get_profile, name='current_user'),
    path('api/user/update/', update_user, name='update_user'),
    path('api/students/', get_students, name='get_students'),
    path('api/user/scores/', get_user_scores, name='get_user_scores'),
    
    # Оценки компетенций
    path('api/competences/scores/', save_competences_scores, name='save_competences_scores'),
    
    # Команды
    path('api/teams/', get_teams, name='get_teams'),
    
    # Индикаторы
    path('api/indicators/', get_indicators, name='get_indicators'),
    
    # Шаблоны чек-листов
    path('api/templates/', get_templates, name='get_templates'),
    path('api/templates/save/', save_template, name='save_template'),
    path('api/templates/<int:template_id>/', delete_template, name='delete_template'),
    path('api/templates/<int:template_id>/update/', update_template, name='update_template'),
    
    # Мероприятия
    path('api/events/create/', create_event, name='create_event'),
    path('api/events/', get_events, name='get_events'),
    
    # Списки индикаторов
    path('api/indicators-list/create/', create_indicators_list, name='create_indicators_list'),
    
    # Чек-листы
    path('api/checklist/save/', save_checklist, name='save_checklist'),
    path('api/checklists/', get_checklists, name='get_checklists'),
    path('api/checklist/<int:checklist_id>/', get_checklist_detail, name='get_checklist_detail'),
    path('api/checklist/<int:checklist_id>/update/', update_checklist, name='update_checklist'),
    path('api/checklist/<int:checklist_id>/delete/', delete_checklist, name='delete_checklist'),

    # Шаблоны опросников
    path('api/poll-templates/', get_poll_templates, name='poll_templates'),
    path('api/poll-templates/create/', create_poll_template, name='create_poll_template'),
    path('api/poll-templates/<int:template_id>/', get_poll_template_detail, name='poll_template_detail'),
    path('api/poll-templates/<int:template_id>/update/', update_poll_template, name='update_poll_template'),
    path('api/poll-templates/<int:template_id>/delete/', delete_poll_template, name='delete_poll_template'),
    
    # Опросники
    path('api/polls/', get_polls, name='polls'),
    path('api/polls/create/', create_poll, name='create_poll'),
    path('api/polls/<int:poll_id>/', get_poll_detail, name='poll_detail'),
    path('api/polls/<int:poll_id>/update/', update_poll, name='update_poll'),
    path('api/polls/<int:poll_id>/delete/', delete_poll, name='delete_poll'),
    
    # Ссылки и ответы
    path('api/poll/assignments/', get_poll_assignments, name='poll_assignments'),
    path('api/poll/link/<str:unique_link>/', get_poll_by_link, name='poll_by_link'),
    path('api/poll/submit/', submit_poll_response, name='submit_poll'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)