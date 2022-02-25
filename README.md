# facepunch-style-commits
- Make a file under `.github/workflows` with this code. Add your discord webhook as a secret named `DISCORD_WEBHOOK`
- Any commits with an exclamation mark will be replaced with random blocks
```yml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Discord webhook
      uses: wildflowericecoffee/facepunch-style-commits@main
      with:
        webhookUrl: ${{ secrets.DISCORD_WEBHOOK }}
```
