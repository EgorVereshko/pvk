from django.utils import timezone
from django.contrib.auth import authenticate, logout, login
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import *
from .serializers import *


@api_view(['GET'])
@ensure_csrf_cookie
@permission_classes([AllowAny])
def get_csrf_token(request):
    token = get_token(request)
    return Response({'csrfToken': str(token)})


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user_profile = serializer.save()

        user = authenticate(
            username=user_profile.user.username,
            password=request.data.get('password')
        )
        if user:
            login(request, user)
            return Response({
                'user_id': user.id,
                'username': user.username,
                'is_authenticated': request.user.is_authenticated
            }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)

        if user:
            login(request, user)
            return Response({
                'user_id': user.id,
                'username': user.username,
                'is_authenticated': request.user.is_authenticated
            })
        else:
            return Response({'error': 'Неверные учетные данные'},
                            status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    try:
        logout(request)
        return Response({'message': 'Успешный выход'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Ошибка при выходе'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    if request.user.is_authenticated:
        return Response({
            'is_authenticated': True,
            'user_id': request.user.id,
            'username': request.user.username,
        })
    else:
        return Response({'is_authenticated': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    try:
        profile = UserProfile.objects.select_related('user').prefetch_related(
            'role_owner',
            'team_member__team'
        ).get(user=request.user)

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        return Response(
            {'error': 'Профиль не найден'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request):
    try:
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except UserProfile.DoesNotExist:
        return Response(
            {'error': 'Профиль не найден'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_qualities_data(request, user_id=None):
    if user_id:
        profile = get_object_or_404(UserProfile, user__id=user_id)
    else:
        profile = request.user.profile

    if len(profile.users_qualities.all()) == 0:
        QualitiesScore.objects.create(user=profile, datetime=timezone.now())

    qualities_scores = profile.users_qualities.latest('datetime')
    serializer = QualitiesScoreSerializer(qualities_scores)

    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_events(request):
    profile = UserProfile.objects.get(user=request.user)
    team = TeamMember.objects.get(member=profile).team

    events = Event.objects.filter(team=team)
    serializer = StudentEventsSerializer(events, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tutor_events(request):
    profile = UserProfile.objects.get(user=request.user)
    teams = Team.objects.filter(tutor=profile)

    events = Event.objects.filter(team__in=teams).select_related('team')
    serializer = TutorEventsSerializer(events, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)
