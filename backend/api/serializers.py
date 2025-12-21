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

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


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
            'phone_number', 'telegram', 'email', 'vk',
            'university', 'year_of_study', 'description',
            'photo_url', 'roles', 'team_name'
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


class StudentEventsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'datetime']


class TutorEventsSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'datetime', 'team_name']


class QualitiesScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualitiesScore
        fields = [
            'learning_score',
            'involvement_score',
            'organization_score',
            'teamwork_score'
        ]
