@echo off
git remote | findstr "origin" > nul
if %errorlevel% neq 0 (
    git remote add origin https://github.com/JOAO2001ARTHUR/abacate-family.git
)
git push -u origin master
pause