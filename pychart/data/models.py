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

class Edge(models.Model):
    source = models.ForeignKey(Lib, related_name='source_library')
    dest = models.ForeignKey(Lib, related_name='dest_library')
    repo = models.ForeignKey(Repo)

    added = models.DateTimeField(null=False, blank=False, unique=True)
    deleted = models.DateTimeField(null=True, blank=False, unique=True)

    def save(self, *args, **kwargs):
        self.added = self.added.replace(hour=0, minute=0, second=0, microsecond=0)
        self.added = self.added - datetime.timedelta(days= self.added.weekday())

        if self.deleted:
            self.deleted = self.deleted.replace(hour=0, minute=0, second=0, microsecond=0)
            self.deleted = self.deleted - datetime.timedelta(days=self.deleted.weekday())
            self.deleted += datetime.timedelta(days=7)

        super(Edge, self).save(*args, **kwargs)

    class Meta:
        unique_together = (('source', 'dest', 'repo'))