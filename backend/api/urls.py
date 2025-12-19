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
    path('api/user/', get_user, name='get_user'),
    path('api/user/update/', update_user, name='update_user'),
    path('api/student_events/', get_student_events, name='get_student_events'),
    path('api/tutor_events/', get_tutor_events, name='get_student_events'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
