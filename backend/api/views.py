from datetime import datetime, timedelta
from collections import defaultdict

from django.db import transaction
from django.db.models import Avg, Count
from django.utils import timezone
from django.contrib.auth import authenticate, logout, login
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsOrganizer, IsTutorOrOrganizer, IsProjectant, IsTutor
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
    try:
        profile = UserProfile.objects.get(user__id=user_id)

        two_months_ago = timezone.now() - timedelta(days=60)
        quality_scores = (QualitiesScoreRegister
                          .objects
                          .filter(
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
    try:
        teams = Team.objects.all().values('id', 'name')
        return Response(list(teams), status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_team_member_count(request, team_id):
    try:
        team = Team.objects.get(id=team_id)
        count = TeamMember.objects.filter(team=team).count()
        return Response({'count': count}, status=status.HTTP_200_OK)
    except Team.DoesNotExist:
        return Response({'error': 'Команда не найдена'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_indicators(request):
    try:
        indicators = Indicator.objects.all().values('id', 'name', 'description')
        return Response(list(indicators), status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def get_templates(request):
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
    try:
        data = request.data
        creator = UserProfile.objects.get(user=request.user)
        template_name = data.get('name')
        indicators_id_list = data.get('indicators')

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
    try:
        data = request.data
        name = data.get('name')
        form_type = data.get('type')
        if form_type != 'Оценка 360':
            template_id = data.get('template_id')
        else:
            template_id = None
        teams_id = data.get('teams_id')
        
        start_datetime_str = data.get('start_datetime')
        end_datetime_str = data.get('end_datetime')
        
        start_datetime = parse_datetime(start_datetime_str.replace('Z', '+00:00'))
        end_datetime = parse_datetime(end_datetime_str.replace('Z', '+00:00'))

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
            AssessmentFormTeam.objects.create(
                assessment_form=assessment_form, 
                team_id=team_id
            )

        return Response({'id': assessment_form.id}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def update_form(request, form_id):
    try:
        form = get_object_or_404(AssessmentForm, id=form_id)
        data = request.data
        name = data.get('name')
        form_type = data.get('type')
        start_datetime = parse_datetime(data.get('start_datetime'))
        end_datetime = parse_datetime(data.get('end_datetime'))

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
                if form.template:
                    template_data = {
                        'id': form.template.id,
                        'name': form.template.name,
                        'creator_profile_id': form.template.creator.id,
                        'creator_name': form.template.creator.short_name(),
                        'created_at': form.template.created_at,
                        'indicators': [{
                            'id': indicator.id,
                            'name': indicator.name
                        } for indicator in form.template.get_indicators()]
                    }
                else:
                    template_data = {
                        'id': None,
                        'name': 'Без шаблона',
                        'indicators': []
                    }
                
                form_data |= {
                    'template': template_data,
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
                if form.template:
                    template_info = {
                        'id': form.template.id,
                        'name': form.template.name
                    }
                else:
                    template_info = {
                        'id': None,
                        'name': 'Без шаблона'
                    }
                
                form_data |= {
                    'template': template_info,
                    'teams_names': form.get_teams_names()
                }

        case 'Опросник':
            if detailed:
                if form.template:
                    template_data = {
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
                                'id': q.id,
                                'question': q.question,
                                'answer_positive': q.answer_positive,
                                'answer_neutral': q.answer_neutral,
                                'answer_negative': q.answer_negative
                            } for q in IndicatorQuestion.objects.filter(indicator_id=indicator.id)]
                        } for indicator in (form.template.get_indicators() if form.template else [])]
                    }
                else:
                    template_data = {
                        'id': None,
                        'name': 'Без шаблона',
                        'indicators': []
                    }
                
                form_data |= {
                    'template': template_data
                }

                if evaluator is not None:
                    form_data |= {
                        'evaluator': {
                            'id': evaluator.id,
                            'short_name': evaluator.short_name()
                        }
                    }
            else:
                if form.template:
                    template_info = {
                        'id': form.template.id,
                        'name': form.template.name
                    }
                else:
                    template_info = {
                        'id': None,
                        'name': 'Без шаблона'
                    }
                
                form_data |= {
                    'template': template_info,
                    'teams_names': form.get_teams_names()
                }

    return form_data


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTutor])
def get_tutor_forms(request):
    profile = get_object_or_404(UserProfile, user=request.user)
    teams = Team.objects.filter(tutor=profile).select_related('tutor')

    forms = []
    for a in AssessmentFormTeam.objects.filter(team__in=teams).select_related('team', 'assessment_form'):
        forms.append(get_form_data(a.assessment_form, detailed=False))

    return Response(forms, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizer])
def get_all_forms(request):
    forms = []
    for a in AssessmentFormTeam.objects.all().select_related('assessment_form'):
        forms.append(get_form_data(a.assessment_form, detailed=False))

    return Response(forms, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTutorOrOrganizer])
def get_form_detailed(request, form_id):
    form = get_object_or_404(AssessmentForm, id=form_id)
    form_data = get_form_data(form, detailed=True)

    return Response(form_data, status=status.HTTP_200_OK)


def get_360(request, form):
    evaluator = UserProfile.objects.select_related('user').get(user=request.user)
    form_data = get_form_data(form, evaluator=evaluator)

    return Response(form_data, status=status.HTTP_200_OK)


def get_check_list(request, form):
    evaluator = UserProfile.objects.select_related('user').get(user=request.user)
    form_data = get_form_data(form, detailed=True, evaluator=evaluator)

    return Response(form_data, status=status.HTTP_200_OK)


def get_poll(request, form):
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
            return get_360(request, form)
        case 'Чек-лист':
            return get_check_list(request, form)
        case 'Опросник':
            return get_poll(request, form)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsProjectant])
def submit_360_form(request):
    try:
        serializer = Assessment360SubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

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
    try:
        data = request.data
        form_id = data.get('form_id')
        evaluator_id = data.get('evaluator_id')
        evaluated_projectants = data.get('evaluated_projectants', [])
        
        form = get_object_or_404(AssessmentForm, id=form_id)
        
        form.update_status()
        if form.status != 'Активна':
            return Response(
                {'error': 'Форма не активна. Нельзя отправить оценку.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if form.type != 'Чек-лист':
            return Response(
                {'error': 'Эта форма не является чек-листом.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        evaluator = get_object_or_404(UserProfile, user_id=evaluator_id) if evaluator_id else get_object_or_404(UserProfile, user=request.user)
        
        records_to_create = []
        for projectant_data in evaluated_projectants:
            evaluated_projectant_id = projectant_data.get('evaluated_projectant_id')
            scores_list = projectant_data.get('scores', [])
            
            for score_item in scores_list:
                indicator_id = score_item.get('indicator_id')
                score_value = score_item.get('score')
                
                records_to_create.append(IndicatorScoresRegister(
                    evaluated_projectant_id=evaluated_projectant_id,
                    evaluator=evaluator,
                    form=form,
                    indicator_id=indicator_id,
                    score=score_value,
                ))
        
        if records_to_create:
            IndicatorScoresRegister.objects.bulk_create(records_to_create)
        
        return Response({
            'message': 'Оценки чек-листа успешно сохранены',
            'form_id': form.id,
            'form_name': form.name
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Ошибка сохранения: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsProjectant])
def submit_poll_form(request):
    try:
        data = request.data
        form_id = data.get('form_id')
        answers = data.get('answers', [])
        
        profile = UserProfile.objects.get(user=request.user)
        form = AssessmentForm.objects.get(id=form_id, type='Опросник')
        
        teams = form.get_teams()
        is_member = False
        for team in teams:
            if TeamMember.objects.filter(team=team, member=profile).exists():
                is_member = True
                break
        
        if not is_member:
            return Response({'error': 'У вас нет доступа к этой форме'}, status=status.HTTP_403_FORBIDDEN)
        
        print(f"Сохранение ответов от {profile.short_name()} для формы {form.name}:")
        for answer in answers:
            print(f"  Вопрос {answer['question_id']}: {answer['value']}")
        
        return Response({'message': 'Ответы успешно сохранены'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students(request):
    try:
        students = UserProfile.objects.select_related('user').all()
        students_list = []
        for student in students:
            students_list.append({
                'id': student.id,
                'user_id': student.user.id,
                'short_name': f"{student.last_name} {student.first_name[0]}.{student.middle_name[0]}.",
                'full_name': f"{student.last_name} {student.first_name} {student.middle_name}",
                'last_name': student.last_name,
                'first_name': student.first_name,
                'middle_name': student.middle_name
            })
        return Response(students_list, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_competences_scores(request):
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
            
            quality, created = Quality.objects.get_or_create(
                name=competence_name
            )
            
            assessment_model, _ = AssessmentModel.objects.get_or_create(status='Активная')
            
            quality_score = QualitiesScoreRegister.objects.create(
                user=student_profile,
                quality=quality,
                model=assessment_model,
                score=score_value
            )
            
            created_scores.append({
                'student': student_profile.short_name(),
                'competence': quality.name,
                'score': float(quality_score.score)
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
def get_team_members(request, team_id):
    try:
        team = Team.objects.get(id=team_id)
        members = TeamMember.objects.filter(team=team).select_related('member')
        members_list = [{
            'id': m.member.id,
            'name': m.member.short_name(),
            'full_name': m.member.full_name(),
            'short_name': m.member.short_name()
        } for m in members]
        return Response(members_list, status=status.HTTP_200_OK)
    except Team.DoesNotExist:
        return Response({'error': 'Команда не найдена'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_qualities_list(request):
    try:
        qualities = Quality.objects.all().order_by('id')
        serializer = QualitySerializer(qualities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_indicators_list(request):
    try:
        indicators = Indicator.objects.all().order_by('id')
        serializer = IndicatorSerializer(indicators, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizer])
def get_assessment_models_list(request):
    try:
        models = AssessmentModel.objects.all().order_by('-id')
        serializer = AssessmentModelSerializer(models, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@transaction.atomic
@permission_classes([IsAuthenticated, IsOrganizer])
def create_assessment_model_view(request):
    try:
        serializer = CreateAssessmentModelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        name = data.get('name')
        ratios_data = data.get('qualities_indicators_ratios', [])
        
        if not name:
            return Response({'error': 'Не указано название модели'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not ratios_data:
            return Response({'error': 'Не указаны связи качеств и индикаторов'}, status=status.HTTP_400_BAD_REQUEST)
        
        model = AssessmentModel.objects.create(name=name, status='Неактивная')
        
        for record in ratios_data:
            QualityIndicatorRatio.objects.create(
                quality_id=record['quality_id'],
                indicator_id=record['indicator_id'],
                model=model,
                ratio=record['ratio'],
            )
        
        return Response({'id': model.id, 'message': 'Модель создана'}, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@transaction.atomic
@permission_classes([IsAuthenticated, IsOrganizer])
def update_assessment_model_view(request):
    try:
        serializer = UpdateAssessmentModelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        model_id = data.get('model_id')
        ratios_data = data.get('qualities_indicators_ratios', [])
        
        model = get_object_or_404(AssessmentModel, id=model_id)
        
        if model.status == 'Активная':
            return Response({'error': 'Нельзя редактировать активную модель. Сначала сделайте активной другую модель.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        QualityIndicatorRatio.objects.filter(model=model).delete()
        
        for record in ratios_data:
            QualityIndicatorRatio.objects.create(
                quality_id=record['quality_id'],
                indicator_id=record['indicator_id'],
                model=model,
                ratio=record['ratio'],
            )
        
        recalculate_scores()
        
        return Response({'message': 'Модель обновлена'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@transaction.atomic
@permission_classes([IsAuthenticated, IsOrganizer])
def delete_assessment_model_view(request):
    try:
        serializer = DeleteAssessmentModelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        model_id = serializer.validated_data.get('model_id')
        
        if AssessmentModel.objects.count() == 1:
            return Response({'error': 'Нельзя удалить единственную модель оценивания'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        model = get_object_or_404(AssessmentModel, id=model_id)
        
        if model.status == 'Активная':
            return Response({'error': 'Нельзя удалить активную модель. Сначала сделайте активной другую модель.'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        model.delete()
        
        return Response({'message': 'Модель удалена'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@transaction.atomic
@permission_classes([IsAuthenticated, IsOrganizer])
def set_active_model_view(request):
    """
    Устанавливает новую активную модель и пересчитывает оценки.
    Ожидает данные в формате:
    {
        'model_id': 1
    }
    """
    try:
        serializer = SetActiveModelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        model_id = serializer.validated_data.get('model_id')
        
        new_active_model = get_object_or_404(AssessmentModel, id=model_id)
        
        # Деактивируем все модели
        AssessmentModel.objects.filter(status='Активная').update(status='Неактивная')
        
        # Активируем выбранную
        new_active_model.status = 'Активная'
        new_active_model.save()
        
        # Пересчитываем оценки
        recalculate_scores()
        
        return Response({
            'message': f'Активная модель изменена на "{new_active_model.name}", оценки пересчитаны'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

def recalculate_scores():
    """
    Пересчитывает оценки качеств для всех завершённых форм
    на основе активной модели оценивания.
    """
    try:
        model = AssessmentModel.objects.get(status='Активная')
        print(f"[INFO] Пересчёт оценок по модели: {model.name}")
        
        completed_forms = AssessmentForm.objects.filter(status='Завершена')
        print(f"[INFO] Найдено завершённых форм: {completed_forms.count()}")
        
        if not completed_forms.exists():
            print("[WARNING] Нет завершённых форм для пересчёта")
            return
        
        for form in completed_forms:
            print(f"[INFO] Обработка формы: {form.name} (ID: {form.id}, тип: {form.type})")
            
            if form.type == 'Оценка 360':
                scores_qs = Scores360Register.objects.filter(form=form).values(
                    'evaluated_projectant_id', 'quality_id'
                ).annotate(avg_score=Avg('score'), count=Count('id'))
                
                for item in scores_qs:
                    # ИСПРАВЛЕНО: используем update_or_create вместо delete + create
                    QualitiesScoreRegister.objects.update_or_create(
                        user_id=item['evaluated_projectant_id'],
                        quality_id=item['quality_id'],
                        model=model,
                        defaults={
                            'score': item['avg_score'],
                            'scores_count': item['count'],
                            'created_at': timezone.now()
                        }
                    )
                print(f"[INFO]   Обработано {scores_qs.count()} записей для 360 формы")
                
            elif form.type in ['Чек-лист', 'Опросник']:
                quality_ratios = {}
                all_quality_ids = set()
                
                for rec in QualityIndicatorRatio.objects.filter(model=model).values('quality_id', 'indicator_id', 'ratio'):
                    quality_ratios.setdefault(rec['quality_id'], {})[rec['indicator_id']] = rec['ratio']
                    all_quality_ids.add(rec['quality_id'])
                
                if not quality_ratios:
                    print(f"[WARNING]   Нет коэффициентов для модели {model.name}")
                    continue
                
                avg_ind_scores_qs = IndicatorScoresRegister.objects.filter(form=form).values(
                    'evaluated_projectant_id', 'indicator_id'
                ).annotate(avg_score=Avg('score'))
                
                if not avg_ind_scores_qs.exists():
                    print(f"[WARNING]   Нет оценок индикаторов для формы {form.name}")
                    continue
                
                projectant_scores = {}
                projectant_ids = set()
                for rec in avg_ind_scores_qs:
                    projectant_scores.setdefault(rec['evaluated_projectant_id'], {})[rec['indicator_id']] = rec['avg_score']
                    projectant_ids.add(rec['evaluated_projectant_id'])
                
                # ИСПРАВЛЕНО: используем update_or_create для каждого студента и качества
                new_scores_count = 0
                for p_id in projectant_ids:
                    p_ind = projectant_scores.get(p_id, {})
                    for q_id in all_quality_ids:
                        indicators_map = quality_ratios.get(q_id, {})
                        total_score = 0.0
                        for i_id, ratio in indicators_map.items():
                            ind_score = p_ind.get(i_id, 0.0)
                            weighted = ind_score * ratio
                            if weighted > 0:
                                weighted *= 3
                            total_score += weighted
                        
                        obj, created = QualitiesScoreRegister.objects.update_or_create(
                            user_id=p_id,
                            quality_id=q_id,
                            model=model,
                            defaults={
                                'score': total_score,
                                'created_at': timezone.now()
                            }
                        )
                        new_scores_count += 1
                
                print(f"[INFO]   Обработано {new_scores_count} записей")
        
        print("[INFO] Пересчёт оценок завершён")
        
    except AssessmentModel.DoesNotExist:
        print("[ERROR] Нет активной модели для пересчёта")
    except Exception as e:
        print(f"[ERROR] Ошибка пересчёта: {str(e)}")
        import traceback
        traceback.print_exc()