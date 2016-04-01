import datetime
from django.db import models


# Model of libraries
class Lib(models.Model):
    import_name   = models.CharField(max_length=255, null=False, blank=False, default='', unique=True)
    friendly_name = models.CharField(max_length=255, null=False, blank=False, default='', unique=True)
    pypi_link     = models.CharField(max_length=255, null=False, blank=True, default='')


# Repo
class Repo(models.Model):
    repo_name     = models.CharField(max_length=255, null=False, blank=False, default='', unique=True)
    friendly_name = models.CharField(max_length=255, null=False, blank=False, default='', unique=True)
    repo_addr     = models.CharField(max_length=255, null=False, blank=False, default='', unique=True)


# Lib Snapshot
class LibSnapshot(models.Model):
    lib  = models.ForeignKey(Lib)
    date = models.DateTimeField(null=False, blank=False, unique=True)
    uses = models.ManyToManyField("Lib", related_name='lib_used_with')

    def save(self, *args, **kwargs):
        self.date = self.date.replace(hour=0, minute=0, second=0, microsecond=0)
        self.date = self.date - datetime.timedelta(days= self.date.weekday())
        super(LibSnapshot, self).save(*args, **kwargs)

# Repo Snapshot
class RepoSnapshot(models.Model):
    repo    = models.ForeignKey(Repo)
    date    = models.DateTimeField(null=False, blank=False, unique=True)
    added   = models.ManyToManyField("Lib", related_name='libs_added')
    removed = models.ManyToManyField("Lib", related_name='libs_removed')