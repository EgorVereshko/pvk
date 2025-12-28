from django.contrib.auth import authenticate
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Q
from .models import *
from .serializers import *

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    try:
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
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
def get_students(request):
    try:
        students = UserProfile.objects.all().values(
            'id', 'last_name', 'first_name', 'middle_name'
        )
        students_list = []
        for student in students:
            students_list.append({
                'id': student['id'],
                'short_name': f"{student['last_name']} {student['first_name'][0]}.{student['middle_name'][0]}.",
                'full_name': f"{student['last_name']} {student['first_name']} {student['middle_name']}"
            })
        return Response(students_list, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_competences_scores(request):
    """
    Сохраняет оценки компетенций для студента
    Ожидаемый формат: [{"competence_name": "Вовлеченность", "score": 2, "student_profile_id": 1}, ...]
    """
    try:
        scores_data = request.data
        created_scores = []
        
        for score_data in scores_data:
            competence_name = score_data.get('competence_name')
            score_value = float(score_data.get('score', 0))
            student_profile_id = score_data.get('student_profile_id')
            
            try:
                student_profile = UserProfile.objects.get(id=student_profile_id)
            except UserProfile.DoesNotExist:
                return Response(
                    {'error': f'Студент с ID {student_profile_id} не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            competence, created = Competence.objects.get_or_create(
                name=competence_name
            )
            
            competences_score, created = CompetencesScore.objects.update_or_create(
                user=student_profile,
                competence=competence,
                defaults={'score': score_value}
            )
            
            created_scores.append({
                'student': student_profile.short_name(),
                'competence': competence.name,
                'score': float(competences_score.score)
            })
        
        return Response({
            'message': 'Оценки успешно сохранены',
            'scores': created_scores
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Ошибка при сохранении: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
