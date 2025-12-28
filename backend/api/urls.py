from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import *

urlpatterns = [
    path('api/register/', register, name='register'),
    path('api/login/', login_view, name='login_view'),
    path('api/logout/', logout_view, name='logout'),
    path('api/check_auth/', check_auth, name='check_auth'),
    path('api/csrf/', get_csrf_token, name='csrf'),
    path('api/current_user/', get_user, name='get_current_user'),
    path('api/user/<int:user_id>/', get_user, name='get_user'),
    path('api/user/update/', update_user, name='update_user'),
    path('api/student_events/', get_student_events, name='get_student_events'),
    path('api/get_event_members/<int:event_id>/', get_event_members, name='get_team_members'),
    path('api/record_assessment/', create_qualities_assessment, name='record_assessment'),
    path('api/tutor_events/', get_tutor_events, name='get_student_events'),
    path('api/current_qualities/<int:user_id>/', get_current_qualities, name='get_current_qualities'),
    path('api/qualities_stats/<int:user_id>/', get_qualities_stats, name='get_qualities_stats'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
