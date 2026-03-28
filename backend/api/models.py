from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    last_name = models.CharField(max_length=50)  # Фамилия
    first_name = models.CharField(max_length=50)  # Имя
    middle_name = models.CharField(max_length=50)  # Отчество
    email = models.CharField(null=True, blank=True)

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

    def __str__(self):
        return f'{self.user} - {self.role}'


class Team(models.Model):
    name = models.CharField(max_length=100)
    tutor = models.ForeignKey(UserProfile, models.SET_NULL, related_name='teams_tutor', null=True)

    def __str__(self):
        return f'Команда "{self.name}" Куратор: {self.tutor} ' \
               f'Состав: {self.get_members_names()}'

    def get_members_names(self):
        return ', '.join([member.short_name() for member in UserProfile.objects.filter(team_member__team=self)])


class TeamMember(models.Model):
    team = models.ForeignKey(Team, models.CASCADE, related_name='related_team')
    member = models.ForeignKey(UserProfile, models.CASCADE, related_name='team_member')

    class Meta:
        unique_together = ('team', 'member')

    def __str__(self):
        return f'{self.team.name} - {self.member}'


class Quality(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class Indicator(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class IndicatorQuestion(models.Model):
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='question')
    question = models.TextField(max_length=500)
    answer_positive = models.TextField(max_length=500)
    answer_neutral = models.TextField(max_length=500)
    answer_negative = models.TextField(max_length=500)


class Template(models.Model):
    creator = models.ForeignKey(UserProfile, models.CASCADE, related_name='creators_templates')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f'Шаблон "{self.name}" ({self.creator.short_name()})'


class AssessmentModel(models.Model):
    name = models.CharField(max_length=100)
    status_choices = [
        ('Активная', 'Активная'),
        ('Неактивная', 'Неактивная')
    ]
    status = models.CharField(default=status_choices[0], max_length=10)


class AssessmentForm(models.Model):
    template = models.ForeignKey(Template, models.CASCADE, related_name='forms', null=True, blank=True)
    title = models.CharField(max_length=200)
    type_choices = [
        ('Оценка 360', 'Оценка 360'),
        ('Чеклист', 'Чеклист'),
        ('Опросник', 'Опросник')
    ]
    type = models.CharField(choices=type_choices, max_length=10)
    status_choices = [
        ('Запланирована', 'Запланирована'),
        ('Активна', 'Активна'),
        ('Завершена', 'Завершена')
    ]
    status = models.CharField(choices=status_choices, max_length=13)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()


class IndicatorTemplate(models.Model):
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='+')
    template = models.ForeignKey(Template, models.CASCADE)

    def __str__(self):
        return f'{self.template} - {self.indicator}'


class QualityIndicatorRatio(models.Model):
    quality = models.ForeignKey(Quality, models.CASCADE, related_name='ratios_to_indicators')
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='ratios_to_quailities')
    model = models.ForeignKey(AssessmentModel, models.CASCADE, related_name='qualities_ratios')
    ratio = models.FloatField(default=0.0)

    def __str__(self):
        return f'{self.quality} {self.indicator} {self.ratio}'


class QualitiesScoreRegister(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='qualities_scores')
    quality = models.ForeignKey(Quality, models.CASCADE, related_name='users_scores')
    model = models.ForeignKey(AssessmentModel, models.CASCADE, related_name='qualities')
    created_at = models.DateTimeField()
    scores_count = models.IntegerField(default=1)
    score = models.FloatField(default=0.0)

    def __str__(self):
        return f'{self.user}: {self.quality} №{self.scores_count} - {self.score}' \
               f' {self.created_at.strftime("%d.%m.%Y %H:%M")}'


class Scores360Register(models.Model):
    evaluated_student = models.ForeignKey(UserProfile, models.CASCADE, related_name='recieved_360_scores')
    evaluator = models.ForeignKey(UserProfile, models.CASCADE, related_name='evaluated_360_scores')
    form = models.ForeignKey(AssessmentForm, models.CASCADE, related_name='scores', null=True)
    created_at = models.DateTimeField()
    quality = models.ForeignKey(Quality, models.CASCADE, related_name='scores_360')
    score = models.FloatField(default=0.0)

    def __str__(self):
        return f'Оценка 360 {self.created_at}.  Кто оценил: {self.evaluator}, кого: {self.evaluated_student},' \
               f'качество: {self.quality}, оценка: {self.score}'


class IndicatorScoresRegister(models.Model):
    evaluated_projectant = models.ForeignKey(UserProfile, models.CASCADE, related_name='recieved_indicators_scores')
    evaluator = models.ForeignKey(UserProfile, models.CASCADE, related_name='evaluated_indicators_scores')
    form = models.ForeignKey(AssessmentForm, models.CASCADE, related_name='indicators_scores')
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='scores')
    score = models.FloatField(default=0.0)


class AverageIndicatorScoresRegister(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='average_indicator_scores')
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='average_scores')
    average_score = models.FloatField(default=0.0)
    scores_count = models.IntegerField(default=1)
    period_start = models.DateField()
    period_end = models.DateField()
