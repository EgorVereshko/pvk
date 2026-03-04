# from django.contrib.auth import authenticate
# from rest_framework import generics, status
# from rest_framework.authtoken.models import Token
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework_simplejwt.tokens import RefreshToken
# from django.contrib.auth.models import User
# from django.db.models import Q
# from .models import *
# from .serializers import *

# class RegisterView(generics.CreateAPIView):
#     queryset = User.objects.all()
#     permission_classes = [AllowAny]
#     serializer_class = RegisterSerializer

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         user = serializer.save()

#         refresh = RefreshToken.for_user(user)

#         return Response({
#             'user': {
#                 'id': user.id,
#                 'username': user.username,
#             },
#             'refresh': str(refresh),
#             'access': str(refresh.access_token),
#         }, status=status.HTTP_201_CREATED)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_profile(request):
#     try:
#         profile = request.user.profile
#         serializer = UserProfileSerializer(profile)
#         return Response(serializer.data)
#     except UserProfile.DoesNotExist:
#         return Response(
#             {'error': 'Профиль не найден'},
#             status=status.HTTP_404_NOT_FOUND
#         )

# @api_view(['PUT', 'PATCH'])
# @permission_classes([IsAuthenticated])
# def update_user(request):
#     try:
#         profile = request.user.profile
#         serializer = UserProfileSerializer(profile, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#     except UserProfile.DoesNotExist:
#         return Response(
#             {'error': 'Профиль не найден'},
#             status=status.HTTP_404_NOT_FOUND
#         )

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_students(request):
#     try:
#         students = UserProfile.objects.all().values(
#             'id', 'last_name', 'first_name', 'middle_name'
#         )
#         students_list = []
#         for student in students:
#             students_list.append({
#                 'id': student['id'],
#                 'short_name': f"{student['last_name']} {student['first_name'][0]}.{student['middle_name'][0]}.",
#                 'full_name': f"{student['last_name']} {student['first_name']} {student['middle_name']}"
#             })
#         return Response(students_list, status=status.HTTP_200_OK)
#     except Exception as e:
#         return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def save_competences_scores(request):
#     """
#     Сохраняет оценки компетенций для студента
#     Ожидаемый формат: [{"competence_name": "Вовлеченность", "score": 2, "student_profile_id": 1}, ...]
#     """
#     try:
#         scores_data = request.data
#         created_scores = []
        
#         for score_data in scores_data:
#             competence_name = score_data.get('competence_name')
#             score_value = float(score_data.get('score', 0))
#             student_profile_id = score_data.get('student_profile_id')
            
#             try:
#                 student_profile = UserProfile.objects.get(id=student_profile_id)
#             except UserProfile.DoesNotExist:
#                 return Response(
#                     {'error': f'Студент с ID {student_profile_id} не найден'},
#                     status=status.HTTP_404_NOT_FOUND
#                 )
            
#             competence, created = Competence.objects.get_or_create(
#                 name=competence_name
#             )
            
#             competences_score, created = CompetencesScore.objects.update_or_create(
#                 user=student_profile,
#                 competence=competence,
#                 defaults={'score': score_value}
#             )
            
#             created_scores.append({
#                 'student': student_profile.short_name(),
#                 'competence': competence.name,
#                 'score': float(competences_score.score)
#             })
        
#         return Response({
#             'message': 'Оценки успешно сохранены',
#             'scores': created_scores
#         }, status=status.HTTP_201_CREATED)
        
#     except Exception as e:
#         return Response(
#             {'error': f'Ошибка при сохранении: {str(e)}'},
#             status=status.HTTP_400_BAD_REQUEST
#         )


from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Q
from datetime import datetime
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teams(request):
    """Получение списка команд"""
    try:
        teams = Team.objects.all().values('id', 'name')
        return Response(list(teams), status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_indicators(request):
    """Получение списка индикаторов"""
    try:
        indicators = Indicator.objects.all().values('id', 'name', 'description')
        return Response(list(indicators), status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_templates(request):
    """Получение шаблонов чек-листов текущего пользователя"""
    try:
        templates = IndicatorsListTemplate.objects.filter(
            user=request.user.profile
        ).select_related('indicators_list')
        
        templates_data = []
        for template in templates:
            indicators_list = template.indicators_list
            templates_data.append({
                'id': template.id,
                'name': template.name,
                'user_id': template.user.id,
                'user_name': template.user.short_name(),
                'created_at': template.id,
                'indicators': [
                    {
                        'id': indicators_list.indicator1.id,
                        'name': indicators_list.indicator1.name,
                        'description': indicators_list.indicator1.description
                    },
                    {
                        'id': indicators_list.indicator2.id,
                        'name': indicators_list.indicator2.name,
                        'description': indicators_list.indicator2.description
                    },
                    {
                        'id': indicators_list.indicator3.id,
                        'name': indicators_list.indicator3.name,
                        'description': indicators_list.indicator3.description
                    },
                    {
                        'id': indicators_list.indicator4.id,
                        'name': indicators_list.indicator4.name,
                        'description': indicators_list.indicator4.description
                    },
                    {
                        'id': indicators_list.indicator5.id,
                        'name': indicators_list.indicator5.name,
                        'description': indicators_list.indicator5.description
                    }
                ]
            })
        
        return Response(templates_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_template(request):
    """Сохранение нового шаблона чек-листа"""
    try:
        data = request.data
        template_name = data.get('name')
        indicators_data = data.get('indicators')
        competences = data.get('competences')
        
        if not template_name:
            return Response(
                {'error': 'Необходимо указать название шаблона'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not indicators_data or len(indicators_data) != 5:
            return Response(
                {'error': 'Необходимо указать 5 индикаторов'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем или получаем индикаторы
        indicators = []
        for ind_data in indicators_data:
            indicator, _ = Indicator.objects.get_or_create(
                name=ind_data.get('name', ''),
                defaults={'description': ind_data.get('description', '')}
            )
            indicators.append(indicator)
        
        # Создаем список индикаторов
        indicators_list = IndicatorsList.objects.create(
            indicator1=indicators[0],
            indicator2=indicators[1],
            indicator3=indicators[2],
            indicator4=indicators[3],
            indicator5=indicators[4]
        )
        
        # Создаем шаблон
        template = IndicatorsListTemplate.objects.create(
            user=request.user.profile,
            name=template_name,
            indicators_list=indicators_list
        )
        
        # Сохраняем компетенции, если они есть
        if competences:
            for idx, comp_name in enumerate(competences):
                TemplateCompetence.objects.create(
                    template=template,
                    name=comp_name,
                    order=idx
                )
        
        return Response({
            'id': template.id,
            'name': template.name,
            'message': 'Шаблон успешно сохранен'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_template(request, template_id):
    """Обновление существующего шаблона"""
    try:
        # Проверяем, принадлежит ли шаблон пользователю
        template = IndicatorsListTemplate.objects.get(
            id=template_id,
            user=request.user.profile
        )
        
        data = request.data
        template_name = data.get('name')
        indicators_data = data.get('indicators')
        
        if template_name:
            template.name = template_name
        
        # Обновляем индикаторы, если они переданы
        if indicators_data and len(indicators_data) == 5:
            indicators_list = template.indicators_list
            
            # Обновляем или создаем индикаторы
            indicator1, _ = Indicator.objects.get_or_create(
                name=indicators_data[0].get('name', ''),
                defaults={'description': indicators_data[0].get('description', '')}
            )
            indicator2, _ = Indicator.objects.get_or_create(
                name=indicators_data[1].get('name', ''),
                defaults={'description': indicators_data[1].get('description', '')}
            )
            indicator3, _ = Indicator.objects.get_or_create(
                name=indicators_data[2].get('name', ''),
                defaults={'description': indicators_data[2].get('description', '')}
            )
            indicator4, _ = Indicator.objects.get_or_create(
                name=indicators_data[3].get('name', ''),
                defaults={'description': indicators_data[3].get('description', '')}
            )
            indicator5, _ = Indicator.objects.get_or_create(
                name=indicators_data[4].get('name', ''),
                defaults={'description': indicators_data[4].get('description', '')}
            )
            
            # Обновляем список индикаторов
            indicators_list.indicator1 = indicator1
            indicators_list.indicator2 = indicator2
            indicators_list.indicator3 = indicator3
            indicators_list.indicator4 = indicator4
            indicators_list.indicator5 = indicator5
            indicators_list.save()
        
        template.save()
        
        return Response({
            'id': template.id,
            'name': template.name,
            'message': 'Шаблон успешно обновлен'
        }, status=status.HTTP_200_OK)
        
    except IndicatorsListTemplate.DoesNotExist:
        return Response(
            {'error': 'Шаблон не найден или у вас нет прав на его редактирование'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_template(request, template_id):
    """Удаление шаблона"""
    try:
        template = IndicatorsListTemplate.objects.get(
            id=template_id,
            user=request.user.profile
        )
        template.delete()
        return Response({'message': 'Шаблон удален'}, status=status.HTTP_200_OK)
    except IndicatorsListTemplate.DoesNotExist:
        return Response(
            {'error': 'Шаблон не найден или у вас нет прав на его удаление'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_event(request):
    """Создание нового мероприятия"""
    try:
        data = request.data
        team_id = data.get('team_id')
        datetime_str = data.get('datetime')
        name = data.get('name')
        
        if not all([team_id, datetime_str, name]):
            return Response(
                {'error': 'Необходимо указать команду, дату и название мероприятия'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response(
                {'error': 'Команда не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            event_datetime = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except:
            return Response(
                {'error': 'Неверный формат даты'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем мероприятие с названием
        event = Event.objects.create(
            team=team,
            tutor=request.user.profile,
            datetime=event_datetime,
            name=name  # Вот здесь сохраняем название!
        )
        
        return Response({
            'id': event.id,
            'name': event.name,
            'team': team.name,
            'datetime': event.datetime,
            'tutor': request.user.profile.short_name()
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_indicators_list(request):
    """Создание списка индикаторов из оценок"""
    try:
        data = request.data
        scores_data = data.get('indicators')  # матрица 4x5 с оценками
        
        if not scores_data:
            return Response(
                {'error': 'Необходимо указать оценки'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем индикаторы на основе средних оценок по каждому качеству
        indicators = []
        for quality_scores in scores_data:
            if quality_scores and any(s is not None for s in quality_scores):
                # Вычисляем среднее значение для качества
                valid_scores = [s for s in quality_scores if s is not None]
                avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0
                
                indicator, _ = Indicator.objects.get_or_create(
                    name=str(round(avg_score)),
                    defaults={'description': f'Средняя оценка: {avg_score}'}
                )
                indicators.append(indicator)
            else:
                # Если нет оценок, создаем индикатор по умолчанию
                indicator, _ = Indicator.objects.get_or_create(
                    name='0',
                    defaults={'description': 'Нет оценок'}
                )
                indicators.append(indicator)
        
        # Дополняем до 5 индикаторов, если нужно
        while len(indicators) < 5:
            indicator, _ = Indicator.objects.get_or_create(
                name='0',
                defaults={'description': 'Индикатор по умолчанию'}
            )
            indicators.append(indicator)
        
        # Создаем список индикаторов
        indicators_list = IndicatorsList.objects.create(
            indicator1=indicators[0],
            indicator2=indicators[1],
            indicator3=indicators[2],
            indicator4=indicators[3],
            indicator5=indicators[4]
        )
        
        return Response({
            'id': indicators_list.id,
            'message': 'Список индикаторов создан'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_checklist(request):
    """Сохранение заполненного чек-листа для мероприятия"""
    try:
        data = request.data
        event_id = data.get('event_id')
        students_ids = data.get('students_ids')
        scores_matrix = data.get('scores')
        qualities = data.get('qualities', ['Обучаемость', 'Организованность', 'Работа в команде', 'Вовлеченность'])
        
        print("=" * 50)
        print("СОХРАНЕНИЕ ЧЕК-ЛИСТА")
        print(f"event_id: {event_id}")
        print(f"students_ids: {students_ids}")
        print(f"qualities: {qualities}")
        print(f"scores_matrix: {scores_matrix}")
        
        if not event_id or not students_ids or not scores_matrix:
            return Response(
                {'error': 'Необходимо указать мероприятие, студентов и оценки'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем мероприятие
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Мероприятие не найдено'}, status=status.HTTP_404_NOT_FOUND)
        
        # Создаем список индикаторов (для совместимости)
        indicators = []
        for q in range(min(len(qualities), 4)):
            valid_scores = [s for s in scores_matrix[q] if s is not None]
            avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0
            indicator, _ = Indicator.objects.get_or_create(
                name=str(round(avg_score)),
                defaults={'description': qualities[q] if q < len(qualities) else f'Качество {q+1}'}
            )
            indicators.append(indicator)
        
        # Добавляем 5-й индикатор (общая оценка)
        all_scores = []
        for q in range(len(scores_matrix)):
            all_scores.extend([s for s in scores_matrix[q] if s is not None])
        total_avg = sum(all_scores) / len(all_scores) if all_scores else 0
        total_indicator, _ = Indicator.objects.get_or_create(
            name=str(round(total_avg)),
            defaults={'description': 'Общая оценка'}
        )
        
        # Дополняем индикаторы до 5
        while len(indicators) < 4:
            default_indicator, _ = Indicator.objects.get_or_create(
                name='0',
                defaults={'description': 'По умолчанию'}
            )
            indicators.append(default_indicator)
        indicators.append(total_indicator)
        
        # Создаем список индикаторов
        indicators_list = IndicatorsList.objects.create(
            indicator1=indicators[0],
            indicator2=indicators[1],
            indicator3=indicators[2],
            indicator4=indicators[3],
            indicator5=indicators[4]
        )
        
        # Создаем чек-лист
        checklist = CheckList.objects.create(
            indicators_list=indicators_list,
            evaluated_projectant=None,
            event=event
        )
        
        print(f"Создан чек-лист с ID: {checklist.id}")
        
        # Сохраняем компетенции чек-листа
        for order, quality in enumerate(qualities):
            ChecklistCompetence.objects.create(
                checklist=checklist,
                name=quality,
                order=order
            )
        
        # Сохраняем индивидуальные оценки
        scores_created = 0
        for student_idx, student_id in enumerate(students_ids):
            if student_id:
                try:
                    student = UserProfile.objects.get(id=student_id)
                    for q_idx, quality in enumerate(qualities):
                        if q_idx < len(scores_matrix) and student_idx < len(scores_matrix[q_idx]):
                            score_value = scores_matrix[q_idx][student_idx]
                            if score_value is not None:
                                ChecklistScore.objects.create(
                                    checklist=checklist,
                                    student=student,
                                    quality=quality,
                                    score=score_value
                                )
                                scores_created += 1
                                print(f"  + {quality} для {student.short_name()} = {score_value}")
                except UserProfile.DoesNotExist:
                    print(f"  ! Студент с ID {student_id} не найден")
                    continue
        
        print(f"Всего создано оценок: {scores_created}")
        print("=" * 50)
        
        return Response({
            'id': checklist.id,
            'message': f'Чек-лист успешно сохранен. Создано оценок: {scores_created}'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print("ОШИБКА сохранения чек-листа:")
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_checklists(request):
    """Получение чек-листов для мероприятий текущего пользователя"""
    try:
        # Получаем чек-листы, где пользователь является куратором мероприятия
        checklists = CheckList.objects.filter(
            event__tutor=request.user.profile
        ).select_related('event', 'event__team', 'indicators_list', 'evaluated_projectant')
        
        data = []
        for cl in checklists:
            checklist_data = {
                'id': cl.id,
                'event_id': cl.event.id,
                'event_name': cl.event.name,
                'event_datetime': cl.event.datetime,
                'team_name': cl.event.team.name if cl.event.team else None,
                'evaluated_student': cl.evaluated_projectant.short_name() if cl.evaluated_projectant else None,
                'indicators': [
                    {
                        'id': cl.indicators_list.indicator1.id,
                        'name': cl.indicators_list.indicator1.name,
                        'description': cl.indicators_list.indicator1.description
                    },
                    {
                        'id': cl.indicators_list.indicator2.id,
                        'name': cl.indicators_list.indicator2.name,
                        'description': cl.indicators_list.indicator2.description
                    },
                    {
                        'id': cl.indicators_list.indicator3.id,
                        'name': cl.indicators_list.indicator3.name,
                        'description': cl.indicators_list.indicator3.description
                    },
                    {
                        'id': cl.indicators_list.indicator4.id,
                        'name': cl.indicators_list.indicator4.name,
                        'description': cl.indicators_list.indicator4.description
                    },
                    {
                        'id': cl.indicators_list.indicator5.id,
                        'name': cl.indicators_list.indicator5.name,
                        'description': cl.indicators_list.indicator5.description
                    }
                ]
            }
            data.append(checklist_data)
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_events(request):
    """Получение всех мероприятий текущего пользователя"""
    try:
        events = Event.objects.filter(tutor=request.user.profile).select_related('team')
        data = []
        for event in events:
            data.append({
                'id': event.id,
                'name': event.name,
                'team_name': event.team.name if event.team else None,
                'datetime': event.datetime,
                'checklists_count': CheckList.objects.filter(event=event).count()
            })
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_checklist_detail(request, checklist_id):
    """Получение детальной информации о чек-листе"""
    try:
        checklist = CheckList.objects.select_related(
            'event', 'event__team', 'indicators_list'
        ).get(id=checklist_id)
        
        print(f"Загружаем чек-лист ID: {checklist_id}")
        
        # Получаем компетенции чек-листа
        checklist_competences = ChecklistCompetence.objects.filter(checklist=checklist).order_by('order')
        
        # Если есть сохраненные компетенции, используем их, иначе базовые
        if checklist_competences.exists():
            qualities = [comp.name for comp in checklist_competences]
            print(f"Загружены компетенции из БД: {qualities}")
        else:
            qualities = ['Обучаемость', 'Организованность', 'Работа в команде', 'Вовлеченность']
            print(f"Используем базовые компетенции: {qualities}")
        
        # Получаем все индивидуальные оценки
        individual_scores = ChecklistScore.objects.filter(checklist=checklist).select_related('student')
        print(f"Найдено оценок в БД: {individual_scores.count()}")
        
        # Группируем оценки по студентам
        scores_by_student = {}
        for score in individual_scores:
            if score.student.id not in scores_by_student:
                scores_by_student[score.student.id] = {}
            scores_by_student[score.student.id][score.quality] = score.score
            print(f"  - {score.student.short_name()}, {score.quality}: {score.score}")
        
        # Получаем студентов из команды
        team_members = TeamMember.objects.filter(
            team=checklist.event.team
        ).select_related('member')
        
        students_data = []
        students_ids = []
        
        for tm in team_members:
            student_id = tm.member.id
            students_data.append({
                'id': student_id,
                'name': tm.member.short_name(),
                'full_name': tm.member.full_name()
            })
            students_ids.append(student_id)
        
        # Дополняем до 5 студентов
        while len(students_data) < 5:
            students_data.append({
                'id': None,
                'name': f'Студент {len(students_data) + 1}',
                'full_name': f'Студент {len(students_data) + 1}'
            })
            students_ids.append(None)
        
        # Создаем матрицу оценок
        scores = []
        for q_idx, quality in enumerate(qualities):
            row = []
            for s_idx, student_id in enumerate(students_ids):
                if student_id and student_id in scores_by_student:
                    score_value = scores_by_student[student_id].get(quality)
                    row.append(score_value)
                else:
                    row.append(None)
            scores.append(row)
        
        print("Итоговая матрица оценок:", scores)
        
        return Response({
            'id': checklist.id,
            'event': {
                'id': checklist.event.id,
                'name': checklist.event.name,
                'datetime': checklist.event.datetime,
                'team_name': checklist.event.team.name if checklist.event.team else 'Без команды'
            },
            'students': students_data,
            'qualities': qualities,
            'scores': scores
        }, status=status.HTTP_200_OK)
        
    except CheckList.DoesNotExist:
        return Response({'error': 'Чек-лист не найден'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print("ОШИБКА загрузки чек-листа:")
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_checklist(request, checklist_id):
    """Обновление чек-листа"""
    try:
        checklist = CheckList.objects.select_related(
            'event', 'indicators_list'
        ).get(id=checklist_id, event__tutor=request.user.profile)
        
        data = request.data
        scores_data = data.get('scores')
        students_ids = data.get('students_ids')
        qualities = data.get('qualities')
        
        print("=" * 50)
        print("ОБНОВЛЕНИЕ ЧЕК-ЛИСТА")
        print(f"checklist_id: {checklist_id}")
        print(f"qualities: {qualities}")
        print(f"scores: {scores_data}")
        
        if not scores_data or not qualities:
            return Response(
                {'error': 'Необходимо указать оценки и компетенции'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Обновляем компетенции чек-листа
        ChecklistCompetence.objects.filter(checklist=checklist).delete()
        for order, quality in enumerate(qualities):
            ChecklistCompetence.objects.create(
                checklist=checklist,
                name=quality,
                order=order
            )
        
        # Обновляем индивидуальные оценки
        ChecklistScore.objects.filter(checklist=checklist).delete()
        
        scores_created = 0
        for student_idx, student_id in enumerate(students_ids or []):
            if student_id:
                try:
                    student = UserProfile.objects.get(id=student_id)
                    for q_idx, quality in enumerate(qualities):
                        if q_idx < len(scores_data) and student_idx < len(scores_data[q_idx]):
                            score_value = scores_data[q_idx][student_idx]
                            if score_value is not None:
                                ChecklistScore.objects.create(
                                    checklist=checklist,
                                    student=student,
                                    quality=quality,
                                    score=score_value
                                )
                                scores_created += 1
                                print(f"  + {quality} для студента {student_id} = {score_value}")
                except UserProfile.DoesNotExist:
                    continue
        
        # Обновляем индикаторы
        indicators_list = checklist.indicators_list
        
        # Первые 4 индикатора - средние по первым 4 компетенциям
        for i in range(min(4, len(scores_data))):
            valid_scores = [s for s in scores_data[i] if s is not None]
            avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0
            indicator_value = str(round(avg_score))
            
            indicator_field = getattr(indicators_list, f'indicator{i+1}')
            indicator_field.name = indicator_value
            indicator_field.save()
        
        # 5-й индикатор - общая средняя
        all_values = []
        for q in range(len(scores_data)):
            all_values.extend([s for s in scores_data[q] if s is not None])
        avg_total = sum(all_values) / len(all_values) if all_values else 0
        indicators_list.indicator5.name = str(round(avg_total))
        indicators_list.indicator5.save()
        
        print(f"Создано оценок: {scores_created}")
        print("=" * 50)
        
        return Response({
            'message': 'Чек-лист успешно обновлен',
            'id': checklist.id,
            'scores_created': scores_created
        }, status=status.HTTP_200_OK)
        
    except CheckList.DoesNotExist:
        return Response({'error': 'Чек-лист не найден'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print("ОШИБКА обновления чек-листа:")
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_checklist(request, checklist_id):
    """Удаление чек-листа"""
    try:
        checklist = CheckList.objects.get(id=checklist_id, event__tutor=request.user.profile)
        checklist.delete()
        return Response({'message': 'Чек-лист удален'}, status=status.HTTP_200_OK)
    except CheckList.DoesNotExist:
        return Response({'error': 'Чек-лист не найден'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)