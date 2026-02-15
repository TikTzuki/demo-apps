docker buildx build -t tiktuzki/meeting-room:latest --platform linux/amd64 --push .
curl "https://api.telegram.org/bot{token}/setWebhook?url=https://testhehe.tiktuzki.com/api/telegram/webhook"
npm run discord:register

# https://discord.com/oauth2/authorize?client_id=1075266036829540442&scope=applications.commands+bot&permissions=9073118501888