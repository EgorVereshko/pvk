from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    user = (models.OneToOneField
            (User,
             on_delete=models.CASCADE,
             related_name='profile'))
    last_name = models.CharField(max_length=50)  # Фамилия
    first_name = models.CharField(max_length=50)  # Имя
    middle_name = models.CharField(max_length=50)  # Отчество
    email = models.CharField(null=True, blank=True)
    photo = (models.ImageField
             (upload_to='users_photo/',
              blank=True,
              default='default_avatar.jpeg'))

    def __str__(self):
        return f'{self.short_name()}'

    def full_name(self):
        return f'{self.last_name} {self.first_name} {self.middle_name}'

    def first_and_last_name(self):
        return f'{self.first_name} {self.last_name}'

    def short_name(self):
        return f'{self.last_name} {self.first_name[0]}.{self.middle_name[0]}.'


class UserRole(models.Model):
    user = models.ForeignKey(
        UserProfile,
        models.CASCADE,
        related_name='role_owner')
    role_choices = [
        ('Проектант', 'Проектант'),
        ('Куратор', 'Куратор'),
        ('Организатор', 'Организатор')
    ]
    role = models.CharField(
        max_length=24,
        choices=role_choices,
        default='Проектант')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'role'], name='unique_user_role')
        ]

    def __str__(self):
        return f'{self.user} - {self.role}'


# class Event(models.Model):
#     name = models.CharField(max_length=100)
#     status_choices = [
#         ('Запланировано', 'Запланировано'),
#         ('Идёт', 'Идёт'),
#         ('Завершено', 'Завершено')
#     ]
#     status = models.CharField(choices=status_choices, max_length=13)
#     start_datetime = models.DateTimeField()
#     end_datetime = models.DateTimeField()
#
#     def __str__(self):
#         return f'{self.name}, {self.status},' \
#                f' {self.start_datetime.strftime("%d.%m.%Y %H:%M")}-' \
#                f'{self.end_datetime.strftime("%d.%m.%Y %H:%M")}'


class Team(models.Model):
    name = models.CharField(max_length=100)
    # event = models.ForeignKey(Event, models.CASCADE, related_name='teams', null=True, blank=True)
    tutor = models.ForeignKey(
        UserProfile,
        models.SET_NULL,
        related_name='teams', null=True)

    def __str__(self):
        return f'Команда "{self.name}" Куратор: {self.tutor} ' \
               f'Состав: {self.get_members_names()}'

    def get_members_names(self):
        return ', '.join(
            [team_member.short_name()
             for team_member in
             UserProfile.objects.filter(team_member__team=self)]
        )

    def get_members(self):
        return [record.member for record in TeamMember.objects.filter(team=self).select_related('team', 'member')]


class TeamMember(models.Model):
    team = models.ForeignKey(
        Team,
        models.CASCADE,
        related_name='related_team')
    member = models.ForeignKey(
        UserProfile,
        models.CASCADE,
        related_name='team_member')

    class Meta:
        unique_together = ('team', 'member')

    def __str__(self):
        return f'{self.team.name} - {self.member}'


class Quality(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return f'{self.name}'


class Indicator(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return f'{self.name}'


class IndicatorQuestion(models.Model):
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='question')
    question = models.TextField(max_length=500)
    answer_positive = models.TextField(max_length=500)
    answer_neutral = models.TextField(max_length=500)
    answer_negative = models.TextField(max_length=500)


class AssessmentModel(models.Model):
    name = models.CharField(max_length=100, default='По умолчанию')
    status_choices = [('Активная', 'Активная'), ('Неактивная', 'Неактивная')]
    status = models.CharField(choices=status_choices, max_length=10)

    def __str__(self):
        return f'{self.name}: {self.status}'


class QualityIndicatorRatio(models.Model):
    quality = models.ForeignKey(
        Quality,
        models.CASCADE,
        related_name='ratios_to_indicators')
    indicator = models.ForeignKey(
        Indicator,
        models.CASCADE,
        related_name='ratios_to_qualities')
    model = models.ForeignKey(
        AssessmentModel,
        models.CASCADE,
        related_name='qualities_ratios')
    ratio = models.FloatField(default=0.0)

    def __str__(self):
        return f'{self.quality} {self.indicator} {self.ratio} модель: {self.model.name}'


class Template(models.Model):
    creator = models.ForeignKey(
        UserProfile,
        models.CASCADE,
        related_name='created_templates')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Шаблон "{self.name}" ({self.creator.short_name()})'

    def get_indicators(self):
        return [record.indicator
                for record in
                IndicatorTemplate.objects.filter(template=self).select_related('indicator', 'template')]


class IndicatorTemplate(models.Model):
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='+')
    template = models.ForeignKey(Template, models.CASCADE)

    def __str__(self):
        return f'{self.template} - {self.indicator}'


class AssessmentForm(models.Model):
    name = models.CharField(max_length=200)
    template = models.ForeignKey(
        Template,
        models.CASCADE,
        related_name='forms',
        null=True,
        blank=True)
    # event = models.ForeignKey(Event, models.CASCADE, related_name='forms', null=True, blank=True)
    type_choices = [
        ('Оценка 360', 'Оценка 360'),
        ('Чек-лист', 'Чек-лист'),
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

    def __str__(self):
        return f'{self.name}, {self.type}, {self.status},' \
               f' {self.start_datetime.strftime("%d.%m.%Y %H:%M")}-' \
               f'{self.end_datetime.strftime("%d.%m.%Y %H:%M")}'

    def get_teams_names(self):
        return [record.team.name for record in
                AssessmentFormTeam.objects.filter(assessment_form=self).select_related('team', 'assessment_form')]

    def get_teams(self):
        return [record.team for record in
                AssessmentFormTeam.objects.filter(assessment_form=self).select_related('team', 'assessment_form')]

    def update_status(self):
        if self.status == 'Запланирована' and self.start_datetime < timezone.now() < self.end_datetime:
            self.status = 'Активна'
            self.save()

        elif self.status == 'Активна' and timezone.now() > self.end_datetime:
            self.status = 'Завершена'
            self.save()


class AssessmentFormTeam(models.Model):
    assessment_form = models.ForeignKey(
        AssessmentForm,
        models.CASCADE,
        related_name='teams')
    team = models.ForeignKey(
        Team,
        models.CASCADE,
        related_name='assessments')

    def __str__(self):
        return f'{self.assessment_form.name} - {self.team.name}'


class QualitiesScoreRegister(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='qualities_scores')
    quality = models.ForeignKey(Quality, models.CASCADE, related_name='users_scores')
    model = models.ForeignKey(AssessmentModel, models.CASCADE, related_name='qualities')
    created_at = models.DateTimeField(auto_now_add=True)
    scores_count = models.IntegerField(default=1)
    score = models.FloatField(default=0.0)

    def __str__(self):
        return f'{self.user}: {self.quality} №{self.scores_count} - {self.score}' \
               f' {self.created_at.strftime("%d.%m.%Y %H:%M")}'


class Scores360Register(models.Model):
    evaluated_projectant = models.ForeignKey(
        UserProfile,
        models.CASCADE,
        related_name='received_360_scores')
    evaluator = models.ForeignKey(
        UserProfile,
        models.CASCADE,
        related_name='evaluated_360_scores')
    form = models.ForeignKey(
        AssessmentForm,
        models.CASCADE,
        related_name='scores',
        null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    quality = models.ForeignKey(
        Quality,
        models.CASCADE,
        related_name='scores_360')
    score = models.FloatField(default=0.0)

    def __str__(self):
        return f'Оценка 360.  Кто оценил: {self.evaluator}, ' \
               f'кого: {self.evaluated_projectant},' \
               f'качество: {self.quality}, оценка: {self.score}, {self.created_at.strftime("%d.%m.%Y %H:%M")}'


class IndicatorScoresRegister(models.Model):
    evaluated_projectant = models.ForeignKey(UserProfile, models.CASCADE, related_name='received_indicators_scores')
    evaluator = models.ForeignKey(UserProfile, models.CASCADE, related_name='evaluated_indicators_scores')
    form = models.ForeignKey(AssessmentForm, models.CASCADE, related_name='indicators_scores')
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='scores')
    score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Оценка индикатора.  Кто оценил: {self.evaluator}, ' \
               f'кого: {self.evaluated_projectant},' \
               f'индикатор: {self.indicator}, оценка: {self.score}, {self.created_at.strftime("%d.%m.%Y %H:%M")}'


class AverageIndicatorScoresRegister(models.Model):
    projectant = models.ForeignKey(UserProfile, models.CASCADE, related_name='average_indicator_scores')
    indicator = models.ForeignKey(Indicator, models.CASCADE, related_name='average_scores')
    average_score = models.FloatField(default=0.0)
    scores_count = models.IntegerField(default=1)
    period_start = models.DateField()
    period_end = models.DateField()

    def __str__(self):
        return f'Средняя оценка {self.projectant} за индикатор {self.indicator}. ' \
               f'оценка: {self.average_score}, ' \
               f'{self.period_start.strftime("%d.%m.%Y")}-{self.period_end.strftime("%d.%m.%Y")}'