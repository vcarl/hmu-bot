This is run as a systemd service in a DigitalOcean Droplet. The `docker.hmu.service` is installed to `/etc/systemd/system/`. A full manual deployment after pushing to GitHub looks like:

- ssh into the server (IP rotates, retrieve from DigitalOcean).
- `cd hmu-bot/patreon`
- `docker build . -t hmu-bot:latest`
- `service docker.hmu restart`

On setup, I ran `systemctl enable docker.hmu`.
