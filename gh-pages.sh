#!/usr/bin/env bash
org="joneit"

# set variable repo to current directory name (without path)
repo=${PWD##*/}

# remove temp directory in case it already exists, remake it, switch to it
rm -rf ../temp >/dev/null
mkdir ../temp
pushd ../temp >/dev/null

# clone it so it will be a branch of the repo
git clone -q --single-branch http://github.com/$org/$repo.git
cd $repo >/dev/null

# create and switch to a new gh-pages branch
git checkout -q --orphan gh-pages

# remove all content from this new branch
git rm -rf -q .

# copy repo/build to the cdn directory
cp ../../$repo/build/* . >/dev/null

# send it up
git add . >/dev/null
git commit -q -m '(See gh-pages.sh on master branch.)'
git push -ufq origin gh-pages >/dev/null

# back to workspace
popd >/dev/null

# remove temp directory
rm -rf ../temp >/dev/null

echo 'Opening page at http://$org.github.io/$repo/ ...'
open http://$org.github.io/$repo/demo.html
echo 'CAVEAT: New pages may not be immediately available; you may need to wait a few minutes and refresh.'
