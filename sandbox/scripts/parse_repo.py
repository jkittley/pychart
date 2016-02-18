#!/usr/bin/python

from git import Repo
import os
import shutil
import subprocess

shutil.rmtree('test')
Repo.clone_from('https://github.com/jmoiron/johnny-cache.git', 'test', depth=1)
python_files = []
for root, dirnames, filenames in os.walk('test'):
	for filename in filenames:
		if filename.endswith('.py'):
			python_files.append(os.path.join(root,filename))

imports = []
for python_file in python_files:
	output = subprocess.check_output(['sfood-imports', python_file])
	if output:
		lines = output.split("\n")
		for line in lines:
			imported_chunk = line.split(": ")
			if len(imported_chunk) == 2:
				first_word = imported_chunk[1].split(".")[0]
				if first_word and not first_word in imports:
					imports.append(first_word)


print imports