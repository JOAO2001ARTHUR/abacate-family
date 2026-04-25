@echo off
cd /d "C:\Users\LENOVO\Desktop\Antigravity Oficial\Abacate Family"
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: downgrade Next.js 16 to 15 for Vercel"
"C:\Program Files\Git\cmd\git.exe" push origin master
pause