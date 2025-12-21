from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    last_name = models.CharField(max_length=50)  # Фамилия
    first_name = models.CharField(max_length=50)  # Имя
    middle_name = models.CharField(max_length=50)  # Отчество
    phone_number = models.CharField(max_length=11, null=True, blank=True)
    telegram = models.CharField(max_length=50, null=True, blank=True)
    email = models.CharField(null=True, blank=True)
    vk = models.CharField(max_length=100, null=True, blank=True)
    university = models.CharField(max_length=200, null=True, blank=True)
    year_of_study = models.CharField(max_length=4, null=True, blank=True)
    description = models.TextField(max_length=2000, blank=True)
    photo = models.ImageField(upload_to='users_photo/', blank=True, default='default_avatar.jpeg')

    def __str__(self):
        return f'{self.short_name()}'

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

    class Meta:
        unique_together = ('user', 'role')

    def save(self, *args, **kwargs):
        # Если добавляется роль "Организатор", удаляем все другие роли у этого пользователя
        if self.role == 'Организатор':
            UserRole.objects.filter(user=self.user).exclude(role='Организатор').delete()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user} - {self.role}'


class Team(models.Model):
    name = models.CharField(max_length=100)
    tutor = models.ForeignKey(UserProfile, models.SET_NULL, related_name='teams_tutor', null=True)

    def __str__(self):
        return f'Команда "{self.name}" Куратор: {self.tutor}'


class TeamMember(models.Model):
    team = models.ForeignKey(Team, models.CASCADE, related_name='related_team')
    member = models.ForeignKey(UserProfile, models.CASCADE, related_name='team_member')

    class Meta:
        unique_together = ('team', 'member')

    def __str__(self):
        return f'{self.team} - {self.member}'


class Indicator(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class Template(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='template_user')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f'Шаблон "{self.name}" пользователя:{self.user}'


class IndicatorTemplate(models.Model):
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='+')
    template = models.ForeignKey(Template, models.CASCADE)

    def __str__(self):
        return f''


class Competence(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class CompetencesScore(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='+')
    competence = models.ForeignKey(Competence, models.CASCADE, related_name='+')
    score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)

    def __str__(self):
        return f'{self.user} {self.competence} {self.score}'


class QualityCompetenceRatio(models.Model):
    qualities_choices = [
        ('Обучаемость', 'Обучаемость'),
        ('Вовлеченность', 'Вовлеченность'),
        ('Организованность', 'Организованность'),
        ('Работа в команде', 'Работа в команде')
    ]
    quality = models.CharField(choices=qualities_choices)
    competence = models.ForeignKey(Competence, models.CASCADE, related_name='quality_competence_related')
    ratio = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)

    def __str__(self):
        return f'{self.quality} {self.competence} {self.ratio}'


class CompetenceIndicatorRatio(models.Model):
    competence = models.ForeignKey(Competence, models.CASCADE, related_name='competence_indicator_related')
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='indicator')
    ratio = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)

    def __str__(self):
        return f'{self.competence} {self.indicator} {self.ratio}'


class QualitiesScore(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='users_qualities')
    datetime = models.DateTimeField()
    learning_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)
    involvement_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)
    organization_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)
    teamwork_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)

    def __str__(self):
        return f'{self.user}: ' \
               f'Обучаемость:{self.learning_score} ' \
               f'Вовлеченность:{self.involvement_score} ' \
               f'Организованность:{self.organization_score} ' \
               f'Работа в команде:{self.teamwork_score}'


class QualitiesAssessment(models.Model):
    evaluated_student = models.ForeignKey(UserProfile, models.CASCADE, related_name='+')
    evaluator = models.ForeignKey(UserProfile, models.CASCADE, related_name='+')
    datetime = models.DateTimeField()
    learning_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)
    involvement_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)
    organization_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)
    teamwork_score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)

    def __str__(self):
        return f'Оценка ПВК {self.datetime}. Кто оценил: {self.evaluator}, кого: {self.evaluated_student}'


class Event(models.Model):
    title = models.CharField(max_length=200)
    team = models.ForeignKey(Team, models.CASCADE, related_name='teams_events')
    tutor = models.ForeignKey(UserProfile, models.CASCADE, related_name='tutors_events')
    datetime = models.DateTimeField()

    def __str__(self):
        return f'{self.title}, {self.team.name}, {self.datetime}'


class CheckList(models.Model):
    template = models.ForeignKey(Template, models.CASCADE, related_name='+')
    evaluated_projectant = models.ForeignKey(UserProfile, models.CASCADE, null=True)
    event = models.ForeignKey(Event, models.CASCADE, related_name='+')


class CheckListScoresRegister(models.Model):
    checklist = models.ForeignKey(CheckList, models.CASCADE, related_name='+')
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='+')
    score = models.DecimalField(default=0.0, max_digits=3, decimal_places=2)