This code powers the bot used to power the Hit Me Up Discord. It currently houses 2 separate projects; one to associate an email address with a Discord account, and another to sync Patreon role updates with another role to grant access to restricted channels.

As of April 2024, it's all a little ad hoc. The email<>Discord bot runs on CloudFlare workers, and the Patreon bot runs as a Docker service on a DigitalOcean VPS.

This repository works well as a monorepo for code while we figure out how to automate things, but is best thought of as a collection of scripts and experiments. It is currently public, so please be diligent about secrets like API keys. 

If you have an idea you're not sure about, please [make an issue](https://github.com/hitmeupnyc/hmu-bot/issues)!

Hit Me Up deals with sensitive data about its members — please be mindful of security and privacy risks in the code you contribute.

If you don't have access to the #hit-me-app channel in the HMU Discord, please contact [@vcarl](https://github.com/vcarl).
