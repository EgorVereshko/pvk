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

        UserProfile.objects.create(
            user=user,
            last_name=last_name,
            first_name=first_name,
            middle_name=middle_name
        )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'last_name', 'first_name', 'middle_name',
            'phone_number', 'telegram', 'email', 'vk',
            'university', 'year_of_study', 'description', 'photo_url'
        ]

    def get_photo_url(self, obj):
        if obj.photo and hasattr(obj.photo, 'url'):
            return obj.photo.url
        return '/media/default_avatar.jpeg'


class StudentEventsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    datetime = serializers.DateTimeField(
        # source='datetime',
        # format='%Y-%m-%d'
    )

    class Meta:
        model = Event
        fields = ['id', 'title', 'datetime']


class TutorEventsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    team_name = serializers.CharField(source='team.name', read_only=True)
    datetime = serializers.DateTimeField(
        # source='datetime',
        # format='%Y-%m-%d'
    )

    class Meta:
        model = Event
        fields = ['id', 'title', 'datetime', 'team_name']
