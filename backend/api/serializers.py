from django.utils import timezone
from rest_framework import serializers
from .models import *


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    last_name = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    middle_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'last_name', 'first_name', 'middle_name']

    def validate_username(self, username):
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует.")
        return username

    def create(self, validated_data):
        last_name = validated_data.pop('last_name')
        first_name = validated_data.pop('first_name')
        middle_name = validated_data.pop('middle_name')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=validated_data['username'],
            password=password
        )

        profile = UserProfile.objects.create(
            user=user,
            last_name=last_name,
            first_name=first_name,
            middle_name=middle_name
        )

        UserRole.objects.create(user=profile)

        qualities = Quality.objects.all()
        for quality in qualities:
            QualitiesScoreRegister.objects.create(
                user=profile,
                quality=quality,
                model=AssessmentModel.objects.get_or_create(status='Активная')[0]
            )

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id')
    photo_url = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'last_name', 'first_name', 'middle_name',
            'email', 'photo_url', 'roles', 'team_name'
        ]

    def get_photo_url(self, obj):
        if obj.photo and hasattr(obj.photo, 'url'):
            return obj.photo.url
        return '/media/default_avatar.jpeg'

    def get_roles(self, obj):
        if hasattr(obj, 'role_owner') and obj.role_owner.exists():
            roles = obj.role_owner.all()
            return [role.role for role in roles]
        return []

    def get_team_name(self, obj):
        if hasattr(obj, 'team_member') and obj.team_member.exists():
            return obj.team_member.first().team.name
        return None


class AssessmentFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentForm
        fields = ['id', 'name', 'type', 'status', 'start_datetime', 'end_datetime']


class TeamSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'members']

    def get_members(self, obj):
        members = UserProfile.objects.filter(team_member__team=obj)
        return TeamMemberSerializer(members, many=True, context=self.context).data


class TeamMemberSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id')
    short_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'short_name']

    def get_short_name(self, obj: UserProfile):
        return f'{obj.last_name} {obj.first_name[0]}.{obj.middle_name[0]}.'


# class QualitiesAssessmentSerializer(serializers.ModelSerializer):
#     evaluated_user_id = serializers.IntegerField(write_only=True)
#     evaluator_id = serializers.IntegerField(write_only=True)
#     event_id = serializers.IntegerField(write_only=True)
#
#     class Meta:
#         # model = QualitiesAssessment
#         fields = [
#             'id',
#             'evaluated_user_id',
#             'evaluator_id',
#             'event_id',
#             'learning_score',
#             'involvement_score',
#             'organization_score',
#             'teamwork_score'
#         ]
#
#     def create(self, validated_data):
#         evaluated_user_id = validated_data.pop('evaluated_user_id')
#         evaluator_id = validated_data.pop('evaluator_id')
#         event_id = validated_data.pop('event_id')
#
#         evaluated_user = UserProfile.objects.get(id=evaluated_user_id)
#         evaluator = UserProfile.objects.get(id=evaluator_id)
#         # event = Event.objects.get(id=event_id)
#         # created_at = timezone.now()
#         #
#         # assessment = QualitiesAssessment.objects.create(
#         #     evaluated_student=evaluated_user,
#         #     evaluator=evaluator,
#         #     event=event,
#         #     created_at=created_at,
#         #     **validated_data
#         # )
#
#         # return assessment


# class TutorEventsSerializer(serializers.ModelSerializer):
#     team_name = serializers.CharField(source='team.name', read_only=True)
#
#     class Meta:
#         # model = Event
#         fields = ['id', 'title', 'datetime', 'team_name']


class QualityScoreItemSerializer(serializers.Serializer):
    quality_name = serializers.CharField()
    score = serializers.FloatField()


class ProjectantItemSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    scores = QualityScoreItemSerializer(many=True)


class ProjectantsListSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    scores = QualityScoreItemSerializer(many=True)


class QualitiesScoreSerializer(serializers.Serializer):
    quality_name = serializers.CharField()
    score = serializers.FloatField()


class QualityStatsSerializer(serializers.Serializer):
    quality_name = serializers.CharField()
    scores = serializers.ListField(child=serializers.FloatField())


class QualityScoreSerializer(serializers.Serializer):
    quality_id = serializers.IntegerField()
    score = serializers.FloatField()


class ProjectantScoresSerializer(serializers.Serializer):
    evaluated_projectant_id = serializers.IntegerField()
    scores = QualityScoreSerializer(many=True)


class Assessment360SubmissionSerializer(serializers.Serializer):
    form_id = serializers.IntegerField()
    evaluated_projectants = ProjectantScoresSerializer(many=True)


class IndicatorScoreSerializer(serializers.Serializer):
    """Сериализатор для одной оценки индикатора"""
    indicator_id = serializers.IntegerField()
    score = serializers.FloatField()

    def validate_score(self, value):
        """Проверяет, что оценка в допустимом диапазоне (-1, 0, 1)"""
        if value not in [-1, 0, 1]:
            raise serializers.ValidationError(
                f'Оценка должна быть -1, 0 или 1 (получено: {value})'
            )
        return value


class ProjectantIndicatorScoresSerializer(serializers.Serializer):
    """Сериализатор для оценок одного проектанта"""
    evaluated_projectant_id = serializers.IntegerField()
    scores = IndicatorScoreSerializer(many=True)


class CheckListSubmissionSerializer(serializers.Serializer):
    """Сериализатор для отправки оценок чек-листа"""
    form_id = serializers.IntegerField()
    evaluator_id = serializers.IntegerField()
    evaluated_projectants = ProjectantIndicatorScoresSerializer(many=True)

    def validate_form_id(self, value):
        """Проверяет существование формы"""
        if not AssessmentForm.objects.filter(id=value).exists():
            raise serializers.ValidationError(f'Форма с ID {value} не найдена')
        return value

    def validate_evaluator_id(self, value):
        """Проверяет существование оценивающего"""
        if not UserProfile.objects.filter(id=value).exists():
            raise serializers.ValidationError(f'Оценивающий с ID {value} не найден')
        return value


class PollIndicatorScoreSerializer(serializers.Serializer):
    indicator_id = serializers.IntegerField()
    questions_scores = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)

    def validate_questions_scores(self, value):
        if any(s not in [-1, 0, 1] for s in value):
            raise serializers.ValidationError("Оценки вопросов должны быть -1, 0 или 1")
        return value

class PollEntrySerializer(serializers.Serializer):
    evaluator_id = serializers.IntegerField()
    evaluated_projectant_id = serializers.IntegerField()
    questions_scores = PollIndicatorScoreSerializer(many=True)

class PollSubmissionSerializer(serializers.Serializer):
    form_id = serializers.IntegerField()
    scores = PollEntrySerializer(many=True)
