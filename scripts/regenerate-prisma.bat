@echo off
echo ========================================
echo Regenerando Prisma Client
echo ========================================
echo.
echo IMPORTANTE: Pare o servidor Next.js (Ctrl+C) antes de executar este script!
echo.
pause
echo.
echo Regenerando Prisma Client...
npx prisma generate
echo.
echo ========================================
echo Prisma Client regenerado com sucesso!
echo ========================================
echo.
echo Agora voce pode reiniciar o servidor: npm run dev
echo.
pause
