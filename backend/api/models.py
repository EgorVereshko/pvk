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

    def __str__(self):
        return f'{self.team} - {self.member}'


class Indicator(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class IndicatorsList(models.Model):
    indicator1 = models.ForeignKey(Indicator, models.CASCADE, related_name='indicator_1')
    indicator2 = models.ForeignKey(Indicator, models.CASCADE, related_name='indicator_2')
    indicator3 = models.ForeignKey(Indicator, models.CASCADE, related_name='indicator_3')
    indicator4 = models.ForeignKey(Indicator, models.CASCADE, related_name='indicator_4')
    indicator5 = models.ForeignKey(Indicator, models.CASCADE, related_name='indicator_5')

    def __str__(self):
        return f'{self.indicator1} ' \
               f'{self.indicator2} ' \
               f'{self.indicator3} ' \
               f'{self.indicator4} ' \
               f'{self.indicator5}'


class IndicatorsListTemplate(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='template_user')
    name = models.CharField(max_length=100)
    indicators_list = models.ForeignKey(IndicatorsList, models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True) # добавил
    updated_at = models.DateTimeField(auto_now=True) # добавил

    def __str__(self):
        return f'Шаблон "{self.name}" от {self.user}'


class Competence(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=1000)

    def __str__(self):
        return f'{self.name}'


class CompetencesScore(models.Model):
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='compentences_score_related_user')
    competence = models.ForeignKey(Competence, models.CASCADE, related_name='compentences_score_related_competence')
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
    user = models.ForeignKey(UserProfile, models.CASCADE, related_name='qualities_related_user')
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


class Event(models.Model):
    team = models.ForeignKey(Team, models.CASCADE, related_name='team_on_event')
    tutor = models.ForeignKey(UserProfile, models.CASCADE, related_name='event_tutor')
    datetime = models.DateTimeField()
    name = models.CharField(max_length=200, default='Мероприятие') # добавил

    def __str__(self):
        return f'{self.team.name}, {self.datetime}'


class CheckList(models.Model):
    indicators_list = models.ForeignKey(IndicatorsList, models.CASCADE, related_name='indicators_for_checklist')
    evaluated_projectant = models.ForeignKey(UserProfile, models.CASCADE, null=True)
    event = models.ForeignKey(Event, models.CASCADE, related_name='checklist_event')

class ChecklistScore(models.Model):
    """Индивидуальные оценки студентов в чек-листе"""
    checklist = models.ForeignKey(CheckList, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    quality = models.CharField(max_length=50)  # Обучаемость, Организованность и т.д.
    score = models.IntegerField(choices=[(-1, '-1'), (0, '0'), (1, '1')], null=True, blank=True)
    
    class Meta:
        unique_together = ['checklist', 'student', 'quality']
    
    def __str__(self):
        return f'{self.checklist} - {self.student} - {self.quality}: {self.score}'

class TemplateCompetence(models.Model):
    """Компетенции в шаблоне чек-листа"""
    template = models.ForeignKey(IndicatorsListTemplate, on_delete=models.CASCADE, related_name='competences')
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f'{self.template.name} - {self.name}'

class ChecklistCompetence(models.Model):
    """Компетенции в чек-листе"""
    checklist = models.ForeignKey(CheckList, on_delete=models.CASCADE, related_name='competences')
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        unique_together = ['checklist', 'name']
    
    def __str__(self):
        return f'{self.checklist.id} - {self.name}'

class PollTemplate(models.Model):
    """Шаблон опросника"""
    name = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True)
    created_by = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='poll_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class PollQuestion(models.Model):
    """Вопросы в шаблоне опросника"""
    QUESTION_TYPES = [
        ('rating', 'Оценка (1-5)'),
        ('text', 'Текстовый ответ'),
        ('choice', 'Выбор варианта'),
    ]
    
    template = models.ForeignKey(PollTemplate, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=500)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='rating')
    order = models.IntegerField(default=0)
    required = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.template.name} - {self.text[:50]}"


class PollOption(models.Model):
    """Варианты ответов для вопросов с выбором"""
    question = models.ForeignKey(PollQuestion, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=200)
    value = models.IntegerField(null=True, blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.text


class Poll(models.Model):
    """Функциональный опросник"""
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('active', 'Активен'),
        ('closed', 'Закрыт'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True)
    template = models.ForeignKey(PollTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='polls')
    created_by = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='created_polls')
    teams = models.ManyToManyField(Team, related_name='polls')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class PollAssignment(models.Model):
    """Назначение опросника конкретному студенту"""
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='assignments')
    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='poll_assignments')
    unique_link = models.CharField(max_length=100, unique=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.poll.name} - {self.student.short_name()}"


class PollResponse(models.Model):
    """Ответы на опросник"""
    assignment = models.ForeignKey(PollAssignment, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(PollQuestion, on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True, null=True)
    answer_value = models.IntegerField(null=True, blank=True)
    answer_option = models.ForeignKey(PollOption, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['assignment', 'question']
    
    def __str__(self):
        return f"Ответ на {self.question.text[:30]}"