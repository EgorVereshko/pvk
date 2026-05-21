from datetime import datetime, tzinfo, timedelta
from collections import defaultdict
from django.utils import timezone
from django.contrib.auth import authenticate, logout, login
from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsOrganizer, IsTutorOrOrganizer, IsProjectant, IsTutor
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
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
def get_user(request, user_id=None):
    try:
        if user_id:
            profile = UserProfile.objects.select_related('user').prefetch_related(
                'role_owner',
                'team_member__team'
            ).get(user__id=user_id)
        else:
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
        profile = get_object_or_404(UserProfile, user=request.user)
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


def get_qualities(profile):
    qualities = Quality.objects.all()
    qualities_scores = []

    for quality in qualities:
        score_record = QualitiesScoreRegister.objects.filter(
            quality=quality,
            user=profile
        ).latest('created_at')
        qualities_scores.append(
            {
                'quality_name': quality.name,
                'score': score_record.score,
            }
        )

    return qualities_scores


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def get_projectants(request):
    projectant_roles = UserRole.objects.filter(role='Проектант').select_related('user')
    projectants = [role.user for role in projectant_roles]

    result = []
    for projectant in projectants:
        result.append({
            'full_name': projectant.full_name(),
            'scores': get_qualities(projectant),
        })

    serializer = ProjectantsListSerializer(result, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_latest_qualities_scores(request, user_id=None):
    """
    Возвращает последние оценки за качества в формате:
    [{'quality_name': 'Вовлеченность', 'score': 1.7}, ...]
    """
    try:
        if user_id:
            profile = UserProfile.objects.get(user__id=user_id)
        else:
            profile = UserProfile.objects.get(user=request.user)

        qualities_scores = get_qualities(profile)
        serializer = QualitiesScoreSerializer(qualities_scores, many=True)

        return Response(serializer.data)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_qualities_stats(request, user_id):
    """
        Возвращает оценки за качества за последние 2 месяца
        по возрастанию даты получения (от самых старых до самых новых)
        в формате:
        [
            {
                'quality_name': 'Вовлеченность',
                'scores': [1.7, 2.1, 2.4, 2.6, ...]
            },
        ]
    """
    try:
        profile = UserProfile.objects.get(user__id=user_id)

        two_months_ago = timezone.now() - timedelta(days=60)
        quality_scores = (QualitiesScoreRegister
                          .objects
                          .filter
                              (
                              user=profile,
                              created_at__gte=two_months_ago
                          )
                          .select_related('quality')
                          .order_by('quality__name', 'created_at'))

        qualities_data = defaultdict(list)
        for score in quality_scores:
            (qualities_data[score.quality.name]
             .append(score.score))

        result = [
            {'quality_name': name, 'scores': scores}
            for name, scores in qualities_data.items()
        ]

        serializer = QualityStatsSerializer(result, many=True)
        return Response(serializer.data)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST)


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
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def get_templates(request):
    # Смирнов вроде хотел чтобы шаблоны на всех были общие, так что каждому все пусть выводятся
    """Получение шаблонов чек-листов.
    Отправляет данные в формате:
    {
        'id': 1,
        'name': 'Шаблон 1',
        'creator_profile_id': 1,
        'creator_name': Иванов И.И,
        'created_at': 2026-01-01 12:00:00.000000,
        'indicators': [{'id': 1, 'name': 'Умение планировать'}]
    }
    """
    try:
        templates = Template.objects.all().select_related('creator')

        templates_data = []
        for template in templates:
            indicators_list = template.get_indicators()
            templates_data.append({
                'id': template.id,
                'name': template.name,
                'creator_profile_id': template.creator.id,
                'creator_name': template.creator.short_name(),
                'created_at': template.created_at,
                'indicators': [
                    {
                        'id': indicator.id,
                        'name': indicator.name
                    }
                    for indicator in indicators_list
                ]
            })

        return Response(templates_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def create_template(request):
    """создаёт новый шаблон индикаторов.
    Ожидает данные в формате
    {
        'name': 'шаблон 1',
        'indicators': [3, 1, 8, 5, ...]
    }
    """
    # indicators - cписок id выбранных индикаторов

    try:
        data = request.data
        creator = UserProfile.objects.get(user=request.user)
        template_name = data.get('name')
        indicators_id_list = data.get('indicators')

        # сделай на фронте Проверку на пустое название и 0 выбранных индикаторов сделай на фронте

        template = Template.objects.create(
            creator=creator,
            name=template_name,
        )

        for indicator_id in indicators_id_list:
            IndicatorTemplate.objects.create(template=template, indicator_id=indicator_id)

        return Response({
            'id': template.id,
            'name': template.name,
            'message': 'Шаблон успешно сохранен'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def update_template(request, template_id):
    """Обновление существующего шаблона.
    Ожидает данные в формате
    {
        'name': 'шаблон 1',
        'indicators': [3, 1, 8, 5, ...]
    }
    """
    # indicators - cписок id выбранных индикаторов

    try:
        data = request.data
        template = Template.objects.select_related('creator').get(id=template_id)
        user = UserProfile.objects.get(user=request.user)

        if template.creator != user:
            return Response(
                {'error': 'Вы не создатель шаблона, вы не можете его редактировать'},
                status=status.HTTP_403_FORBIDDEN
            )

        template.name = data.get('name')
        template.save()
        indicators_id_list = data.get('indicators')

        old_indicators_id_list = []

        for record in IndicatorTemplate.objects.select_related('template', 'indicator').filter(template=template):
            old_indicators_id_list.append(record.indicator_id)

        # добавление новых индикаторов к шаблону
        for indicator_id in indicators_id_list:
            if indicator_id not in old_indicators_id_list:
                IndicatorTemplate.objects.create(template=template, indicator_id=indicator_id)

        for indicator_id in old_indicators_id_list:
            if indicator_id not in indicators_id_list:
                IndicatorTemplate.objects.get(id=indicator_id).delete()
            else:
                continue

        return Response({
            'id': template.id,
            'name': template.name,
            'message': 'Шаблон успешно обновлен'
        }, status=status.HTTP_200_OK)

    except Template.DoesNotExist:
        return Response(
            {'error': 'Шаблон не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def delete_template(request, template_id):
    """Удаление шаблона"""
    try:
        template = Template.objects.select_related('creator').get(id=template_id)
        user = UserProfile.objects.get(user=request.user)

        if template.creator != user:
            return Response(
                {'error': 'Вы не создатель шаблона, вы не можете его удалить'},
                status=status.HTTP_403_FORBIDDEN
            )

        template.delete()

        return Response({'message': 'Шаблон удален'}, status=status.HTTP_200_OK)

    except Template.DoesNotExist:
        return Response(
            {'error': 'Шаблон не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def create_form(request):
    """Создание оценочной формы.
    Принимает данные в формате:
    {
        'name': 'форма 1',
        'type': 'Чек-лист',
        'template_id': 3,
        'teams_id': [3, 1, 6, 9, ...],
        'start_datetime' = 2026-01-01 12:00:00.000000,
        'end_datetime' = 2026-01-02 12:00:00.000000
    }
    """
    # варианты type: 'Оценка 360', 'Чек-лист', 'Опросник';
    # если 360, то template_id не добавляй;
    # на фронте сделай проверку, что дата и время окончания позже начала и позже сегодняшнего дня.

    try:
        data = request.data
        name = data.get('name')
        form_type = data.get('type')
        if form_type != 'Оценка 360':
            template_id = data.get('template_id')
        else:
            template_id = None
        teams_id = data.get('teams_id')
        start_datetime = datetime.fromisoformat(data.get('start_datetime'))
        end_datetime = datetime.fromisoformat(data.get('end_datetime'))

        form_status = 'Запланирована'
        if start_datetime < timezone.now():
            form_status = 'Активна'

        assessment_form = AssessmentForm.objects.create(
            name=name,
            template_id=template_id,
            type=form_type,
            status=form_status,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
        )

        for team_id in teams_id:
            AssessmentFormTeam.objects.create(form=assessment_form, team_id=team_id)

        return Response(status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def update_form(request, form_id):
    """Обновляет форму"""
    try:
        form = get_object_or_404(AssessmentForm, id=form_id)
        data = request.data
        name = data.get('name')
        form_type = data.get('type')
        start_datetime = datetime.fromisoformat(data.get('start_datetime'))
        end_datetime = datetime.fromisoformat(data.get('end_datetime'))

        if form_type != 'Оценка 360':
            template_id = data.get('template_id')
        else:
            template_id = None

        form.name = name
        form.type = form_type
        form.template_id = template_id
        form.start_datetime = start_datetime
        form.end_datetime = end_datetime
        form.save()
        form.update_status()

        teams_id = data.get('teams_id')
        old_teams_id = [record.team_id for record in
                        AssessmentFormTeam.objects.select_related('form', 'team').filter(form=form)]

        for team_id in teams_id:
            if team_id not in old_teams_id:
                AssessmentFormTeam.objects.create(team_id=team_id, form=form)
            else:
                continue

        for team_id in old_teams_id:
            if team_id not in teams_id:
                AssessmentFormTeam.objects.get(teams_id=team_id, form=form).delete()
            else:
                continue

        return Response(status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def delete_form(request, form_id):
    """Удаление формы"""
    try:
        form = AssessmentForm.objects.get(id=form_id)
        form.delete()

        return Response({'message': 'Форма удалена'}, status=status.HTTP_200_OK)

    except AssessmentForm.DoesNotExist:
        return Response({'error': 'Шаблон не найден'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsProjectant])
def get_projectant_forms(request):
    """
    Возвращает формы 360 и опросники для проектанта.
    Формат:
    {
        'forms_360': [{
            'id': 1,
            'name': 'форма 360 №2',
            'status': 'Активна',
            'start_datetime': 2026-01-01 12:00:00.000000,
            'end_datetime': 2026-01-02 12:00:00.000000
        },...],
        'forms_polls': [{
            'id': 5,
            'name': 'опросник №6',
            'status': 'Активна',
            'start_datetime': 2026-01-01 12:00:00.000000,
            'end_datetime': 2026-01-02 12:00:00.000000
        },...]
    }
    """
    profile = UserProfile.objects.get(user=request.user)
    team = TeamMember.objects.select_related('team').get(member=profile).team

    forms_360 = []
    forms_polls = []

    for a in (AssessmentFormTeam
            .objects
            .filter(team=team)
            .select_related('team', 'assessment_form')):
        form = a.assessment_form
        if form.type == 'Оценка 360':
            forms_360.append(
                {
                    'id': form.id,
                    'name': form.name,
                    'status': form.status,
                    'start_datetime': form.start_datetime,
                    'end_datetime': form.end_datetime
                }
            )
        elif form.type == 'Опросник':
            forms_polls.append(
                {
                    'id': form.id,
                    'name': form.name,
                    'status': form.status,
                    'start_datetime': form.start_datetime,
                    'end_datetime': form.end_datetime
                }
            )
        else:
            continue

    result = {
        'forms_360': forms_360,
        'forms_polls': forms_polls
    }

    return Response(result, status=status.HTTP_200_OK)


def get_form_data(form: AssessmentForm, detailed: bool = False, evaluator: UserProfile = None):
    form.update_status()

    form_data = {
        'id': form.id,
        'name': form.name,
        'type': form.type,
        'status': form.status,
        'start_datetime': form.start_datetime,
        'end_datetime': form.end_datetime,
    }

    form_type = form.type
    match form_type:
        case 'Оценка 360':
            if evaluator is not None:
                team = TeamMember.objects.select_related('team').get(member=evaluator).team
                form_data |= {
                    'evaluator': {
                        'id': evaluator.id,
                        'short_name': evaluator.short_name(),
                    },
                    'team': {
                        'id': team.id,
                        'name': team.name,
                        'members': [{
                            'id': team_member.id,
                            'name': team_member.short_name()
                        } for team_member in team.get_members()]
                    },
                    'qualities': [{
                        'id': quality.id,
                        'name': quality.name
                    } for quality in Quality.objects.all()]
                }
            elif detailed:
                form_data |= {
                    'teams': [{
                        'id': team.id,
                        'name': team.name,
                        'members': [{
                            'id': team_member.id,
                            'name': team_member.short_name()
                        } for team_member in team.get_members()]
                    } for team in form.get_teams()]
                }
            else:
                form_data.update({'teams_names': form.get_teams_names()})

        case 'Чек-лист':
            if detailed:
                form_data |= {
                    'template': {
                        'id': form.template.id,
                        'name': form.template.name,
                        'creator_profile_id': form.template.creator.id,
                        'creator_name': form.template.creator.short_name(),
                        'created_at': form.template.created_at,
                        'indicators': [{
                            'id': indicator.id,
                            'name': indicator.name
                        } for indicator in form.template.get_indicators()]
                    },
                    'teams': [{
                        'id': team.id,
                        'name': team.name,
                        'members': [{
                            'id': team_member.id,
                            'name': team_member.short_name()
                        } for team_member in team.get_members()]
                    } for team in form.get_teams()]
                }

                if evaluator is not None:
                    form_data['evaluator_id'] = evaluator.id

            else:
                form_data |= {
                    'template': {
                        'id': form.template.id,
                        'name': form.template.name
                    },
                    'teams_names': form.get_teams_names()
                }

        case 'Опросник':
            if detailed:
                form_data |= {
                    'template': {
                        'id': form.template.id,
                        'name': form.template.name,
                        'creator_profile_id': form.template.creator.id,
                        'creator_name': form.template.creator.short_name(),
                        'created_at': form.template.created_at,
                        'teams': [{
                            'id': team.id,
                            'name': team.name,
                            'members': [{
                                'id': team_member.id,
                                'name': team_member.short_name()
                            } for team_member in team.get_members()]
                        } for team in form.get_teams()],
                        'indicators': [{
                            'id': indicator.id,
                            'name': indicator.name,
                            'questions': [{
                                'question': question.question,
                                'answer_positive': question.answer_positive,
                                'answer_neutral': question.answer_neutral,
                                'answer_negative': question.answer_negative
                            } for question in IndicatorQuestion.objects.filter(indicator_id=indicator.id)]
                        } for indicator in form.template.get_indicators()]
                    }
                }

                if evaluator is not None:
                    form_data |= {
                        'evaluator': {
                            'id': evaluator.id,
                            'short_name': evaluator.short_name()
                        }
                    }
            else:
                form_data |= {
                    'template': {
                        'id': form.template.id,
                        'name': form.template.name
                    },
                    'teams_names': form.get_teams_names()
                }

    return form_data


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTutor])
def get_tutor_forms(request):
    """
    Возращает список оценочных форм, в которых участвуют курируемые куратором команды.
    Формат:
    {
        'id': 1,
        'name': 'форма 1',
        'template': {
            'id': 1,
            'name': 'шаблон 1'
        },
        'type': 'Опросник',
        'status': 'Активна',
        'start_datetime' = 2026-01-01 12:00:00.000000,
        'end_datetime' = 2026-01-02 12:00:00.000000,
        'teams_names': ['ПВК', 'Тесты', 'CRM', ...]
        }
    }
    """
    profile = get_object_or_404(UserProfile, user=request.user)
    teams = Team.objects.filter(tutor=profile).select_related('tutor')

    forms = []
    for a in AssessmentFormTeam.objects.filter(team__in=teams).select_related('team', 'assessment_form'):
        forms.append(get_form_data(a.assessment_form, detailed=False))

    return Response(forms, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizer])
def get_all_forms(request):
    """
    Возвращает все оценочные формы.
    Формат:
    {
        'id': 1,
        'name': 'форма 1',
        'template': {
            'id': 1,
            'name': 'шаблон 1',
        },
        'type': 'Опросник',
        'status': 'Активна',
        'start_datetime' = 2026-01-01 12:00:00.000000,
        'end_datetime' = 2026-01-02 12:00:00.000000,
        'teams_names': ['Айкидо', 'Тесты', 'ПВК', 'CRM']
    }
    """
    forms = []
    for a in AssessmentFormTeam.objects.all().select_related('assessment_form'):
        forms.append(get_form_data(a.assessment_form, detailed=False))

    return Response(forms, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def get_form_detailed(request, form_id):
    """
    Возвращает полную информацию о форме.
    Формат:
    {
        'id': 1,
        'name': 'форма 1',
        'template': {
            'id': 1,
            'name': 'шаблон 1',
            'creator_profile_id': 3,
            'creator_name': Смирнов Д.С.,
            'created_at': ,
            'indicators': [{
                'id': 3,
                'name': 'Умение планировать',
                'questions': [{
                    'question': 'При планировании адекватно определяет сроки для задач?,
                    'answer_positive': 'Да',
                    'answer_neutral': 'Затрудняюсь ответить',
                    'answer_negative': 'Нет'
                }]
            }]
        },
        'type': 'Опросник',
        'status': 'Активна',
        'start_datetime' = 2026-01-01 12:00:00.000000,
        'end_datetime' = 2026-01-02 12:00:00.000000,
        'teams': [{
            'id': 2,
            'name': 'ПВК',
            'members': [{
                'id': 1,
                'name': 'Иванов И.И'
            }]
        }],
    }
    """
    # у 360 отсутствует template
    # у чек-листа отсутствует questions у индикаторов

    form = get_object_or_404(AssessmentForm, id=form_id)
    form_data = get_form_data(form, detailed=True)

    return Response(form_data, status=status.HTTP_200_OK)


def get_360(request, form):
    """
    Возвращает полную информацию о форме "360 градусов".
    Формат:
    {
        'id': 1,
        'name': 'форма 1',
        'type': 'Оценка 360',
        'status': 'Активна',
        'start_datetime' = 2026-01-01 12:00:00.000000,
        'end_datetime' = 2026-01-02 12:00:00.000000,
        'evaluator': {
            'id': evaluator.id,
            short_name': evaluator.short_name(),
        },
        'team': {
            'id': 2,
            'name': 'ПВК',
            'members': [{
                'id': 1,
                'name': 'Иванов И.И',
            }]
        },
        'qualities': [{
            'id': 1,
            'name': 'Обучаемость'
        }]
    }
    """
    evaluator = UserProfile.objects.select_related('user').get(user=request.user)
    form_data = get_form_data(form, evaluator=evaluator)

    return Response(form_data, status=status.HTTP_200_OK)


def get_check_list(request, form):
    """
    Возвращает полную информацию о форме 'Чек-лист'.
    Формат:
    {
        'id': 1,
        'name': 'форма 1',
        'template': {
            'id': 1,
            'name': 'шаблон 1',
            'creator_profile_id': 3,
            'creator_name': Смирнов Д.С.,
            'created_at': ,
            'indicators': [{
                'id': 3,
                'name': 'Умение планировать'
            }]
        },
        'type': 'Чек-лист',
        'status': 'Активна',
        'start_datetime' = 2026-01-01 12:00:00.000000,
        'end_datetime' = 2026-01-02 12:00:00.000000,
        'teams': [{
            'id': 2,
            'name': 'ПВК',
            'members': [{
                'id': 1,
                'name': 'Иванов И.И'
            }]
        }],
    }
    """
    evaluator = UserProfile.objects.select_related('user').get(user=request.user)
    form_data = get_form_data(form, detailed=True, evaluator=evaluator)

    return Response(form_data, status=status.HTTP_200_OK)


def get_poll(request, form):
    """
    Возвращает полную информацию о форме 'Опросник'.
    Формат:
    {
        'id': 1,
        'name': 'форма 1',
        'template': {
            'id': 1,
            'name': 'шаблон 1',
            'creator_profile_id': 3,
            'creator_name': Смирнов Д.С.,
            'created_at': ,
            'indicators': [{
                'id': 3,
                'name': 'Умение планировать',
                'questions': [{
                    'question': 'При планировании адекватно определяет сроки для задач?,
                    'answer_positive': 'Да',
                    'answer_neutral': 'Затрудняюсь ответить',
                    'answer_negative': 'Нет'
                }]
            }]
        },
        'type': 'Опросник',
        'status': 'Активна',
        'start_datetime' = 2026-01-01 12:00:00.000000,
        'end_datetime' = 2026-01-02 12:00:00.000000,
        'teams': [{
            'id': 2,
            'name': 'ПВК',
            'members': [{
                'id': 1,
                'name': 'Иванов И.И'
            }]
        }],
    }
    """
    evaluator = UserProfile.objects.select_related('user').get(user=request.user)
    form_data = get_form_data(form, detailed=True, evaluator=evaluator)

    return Response(form_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_form_to_fill(request, form_id):
    form = get_object_or_404(AssessmentForm, id=form_id)

    form_type = form.type
    match form_type:
        case 'Оценка 360':
            get_360(request, form)
        case 'Чек-лист':
            get_check_list(request, form)
        case 'Опросник':
            get_poll(request, form)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsProjectant])
def submit_360_form(request):
    """
    Принимает и сохраняет оценки формы 360 градусов.

    Ожидаемый формат данных:
    {
        'form_id': 1,
        'evaluated_projectants': [{
            'evaluated_projectant_id': 5,
            'scores': [
                {'quality_id': 1, 'score': 4.5},
                {'quality_id': 2, 'score': 3.8},
                {'quality_id': 3, 'score': 5.0}
            ]
        }]
    }
    """
    try:
        serializer = Assessment360SubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # автоматический возврат 400 при ошибке

        validated_data = serializer.validated_data
        form_id = validated_data['form_id']
        evaluator = get_object_or_404(UserProfile, user=request.user)

        for projectant_data in validated_data['evaluated_projectants']:
            for quality_score in projectant_data['scores']:
                Scores360Register.objects.create(
                    form_id=form_id,
                    evaluator=evaluator,
                    evaluated_projectant_id=projectant_data['evaluated_projectant_id'],
                    quality_id=quality_score['quality_id'],
                    score=quality_score['score']
                )

        return Response({'message': 'Оценки успешно сохранены'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': f'Ошибка сохранения: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def submit_check_list_form(request):
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def submit_poll_form(request):
    pass


# def calculate_quality_scores(profile, event_scores):
#     assessment_model = AssessmentModel.objects.get(status='Активная')
#     qualities = Quality.objects.all()
#
#     indicator_scores_scores = {
#         quality: {
#             record.indicator: {
#                 'score': 0,
#                 'ratio': record.ratio
#             }
#             for record in QualityIndicatorRatio.objects.filter(quality=quality)
#         }
#         for quality in qualities
#     }
#
#     for quality in qualities:
#         event_scores[quality] =
#
#         QualitiesScoreRegister.objects.create(
#             user=profile,
#             quality=quality,
#             model=assessment_model,
#             created_at=timezone.now(),
#             score=score
#         )
#
#
# def calculate_360_scores(assessment_form: AssessmentForm):
#     scores = Scores360Register.objects.filter(form=assessment_form)
#
#     evaluated_projectants = [record.evaluated_projectant for record in scores]
#     qualities = [record.quality for record in scores]

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizer])
def get_assessment_models(request):
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizer])
def create_assessment_model(request):
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizer])
def update_assessment_model(request, model_id):
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizer])
def delete_assessment_model(request, model_id):
    pass
