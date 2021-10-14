# facepunch-style-commits

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
