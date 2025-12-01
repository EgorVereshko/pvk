from django.contrib import admin
from .models import *

admin.site.register(UserProfile)
admin.site.register(UserRole)
admin.site.register(Skill)
admin.site.register(UserSkill)
admin.site.register(Criteria)
admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(Score)
admin.site.register(Event)
admin.site.register(CriteriaList)
admin.site.register(CheckList)
