from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(write_only=True)
    age = serializers.IntegerField(write_only=True)
    description = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'name', 'age', 'description']

    def create(self, validated_data):
        name = validated_data.pop('name')
        age = validated_data.pop('age')
        description = validated_data.pop('description', '')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            password=password
        )
        
        UserProfile.objects.create(
            user=user,
            name=name,
            age=age,
            description=description
        )
        
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'name', 'age', 'description']
        read_only_fields = ['id']
