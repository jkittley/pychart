#encoding:UTF-8
import logging
logger = logging.getLogger('custom')

from django.core.management.base import BaseCommand
from pychart.data.models import *
import git
import tempfile
import shutil
import os

from jedi.parser import Parser, load_grammar
from jedi._compatibility import u


class Command(BaseCommand):
	help = 'Takes a snapshot of a git repo'
	def add_arguments(self, parser):
		parser.add_argument('reponame')

	def parse_file(self, file):
		file_imports = set()
		with open(file, 'r') as fp:
			content = fp.read()
		parser = Parser(load_grammar(), u(content), file)
		imports = parser.module.imports
		for imp in imports:
			for path in imp.paths():
				file_imports.update([path[0].value])
		return file_imports


	def parse_dir(self, dir):
		all_imports = set()
		for root, subdirs, files in os.walk(dir):
			for file in files:
				if file.endswith('.py'):
					imports = self.parse_file(os.path.join(root,file))
					for i in imports:
						check_for_file = os.path.join(root, i+".py")
						check_for_folder = os.path.join(root, i+"/__init__.py")
						check_for_root_dir = os.path.join(dir, i+"/__init__.py")		

						if not os.path.exists(check_for_file) and not os.path.exists(check_for_folder) and not os.path.exists(check_for_root_dir):
							all_imports.update([i])

		return all_imports

	def handle(self, *args, **options):
		reponame = options['reponame']
		repo = Repo.objects.get(repo_name=reponame)
		temp_dir = tempfile.mkdtemp()
		git.Repo.clone_from(repo.repo_addr, temp_dir)
		all_imports = self.parse_dir(temp_dir)
		shutil.rmtree(temp_dir)