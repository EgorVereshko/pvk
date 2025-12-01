from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    last_name = models.CharField(max_length=50)  # Фамилия
    first_name = models.CharField(max_length=50)  # Имя
    middle_name = models.CharField(max_length=50)  # Отчество
    phone_number = models.CharField(max_length=11, null=True, blank=True)
    telegram = models.CharField(max_length=50, null=True, blank=True)
    email = models.CharField(max_length=50, null=True, blank=True)
    vk = models.CharField(max_length=100, null=True, blank=True)
    university = models.CharField(max_length=200, null=True, blank=True)
    year_of_study = models.CharField(max_length=4, null=True, blank=True)
    description = models.TextField(max_length=2000, blank=True)
    photo = models.ImageField(upload_to='users_photo/', blank=True, default='default_avatar.jpeg')

    def __str__(self):
        return f'{self.short_name()} - {UserRole(user=self.user)}'

    def full_name(self):
        return f'{self.last_name} {self.first_name} {self.middle_name}'

    def first_and_last_name(self):
        return f'{self.first_name} {self.last_name}'

    def short_name(self):
        return f'{self.last_name} {self.first_name[0]}.{self.middle_name[0]}.'


class UserRole(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='role_owner')
    role_choises = [
        ('Проектант', 'Проектант'),
        ('Куратор', 'Куратор'),
        ('Организатор', 'Организатор')
    ]
    role = models.CharField(max_length=24, choices=role_choises, default='Проектант')

    def __str__(self):
        return f'{self.user} - {self.role}'


class Skill(models.Model):  # Компетенция
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class Criteria(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class UserSkill(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='skill_owner')
    skill = models.ForeignKey(Skill, models.CASCADE, related_name='skill_object')

    def __str__(self):
        return f'{self.user} - {self.skill}'


class Team(models.Model):
    name = models.CharField(max_length=100)
    tutor = models.ForeignKey(UserProfile, models.SET_NULL, related_name='teams_tutor', null=True)

    def __str__(self):
        return f'Команда "{self.name}" Куратор: {self.tutor}'


class TeamMember(models.Model):
    team = models.ForeignKey(Team, models.CASCADE, related_name='related_team')
    member = models.ForeignKey(UserProfile, models.CASCADE, related_name='team_member')

    def __str__(self):
        return f'{self.team} - {self.member}'


class Score(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='related_user')
    criteria = models.ForeignKey(Criteria, models.CASCADE, related_name='score_criteria')
    score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)

    def __str__(self):
        return f'{self.user}: {self.criteria} - {self.score}'


class Event(models.Model):
    team = models.ForeignKey(Team, models.CASCADE, related_name='team_on_event')
    tutor = models.ForeignKey(UserProfile, models.CASCADE, related_name='event_tutor')
    datetime = models.DateTimeField()

    def __str__(self):
        return f'{self.team.name}', {self.datetime}


class CriteriaList(models.Model):
    criteria1 = models.ForeignKey(Criteria, models.CASCADE, related_name='criteria_1')
    criteria2 = models.ForeignKey(Criteria, models.CASCADE, related_name='criteria_2')
    criteria3 = models.ForeignKey(Criteria, models.CASCADE, related_name='criteria_3')
    criteria4 = models.ForeignKey(Criteria, models.CASCADE, related_name='criteria_4')
    criteria5 = models.ForeignKey(Criteria, models.CASCADE, related_name='criteria_5')


class CheckList(models.Model):
    criteria_list = models.ForeignKey(CriteriaList, models.CASCADE, related_name='criteria_for_checklist')
    tutor = models.ForeignKey(UserProfile, models.CASCADE, related_name='checklist_tutor')
    event = models.ForeignKey(Event, models.CASCADE, related_name='checklist_event')
