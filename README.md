# facepunch-style-commits
- Make a `.yml` file under `.github/workflows` with this code below
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
- Add your discord webhook as a secret named `DISCORD_WEBHOOK`
- Any commits with an exclamation mark will be replaced with random blocks
![image](https://user-images.githubusercontent.com/36643731/156659792-5e81e894-1025-4b2a-9840-f190abe85ec0.png)
