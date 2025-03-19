This is run as a systemd service in a DigitalOcean Droplet. The `docker.hmu.service` is installed to `/etc/systemd/system/`. A full manual deployment after pushing to GitHub looks like:

- ssh into the server (IP rotates, retrieve from DigitalOcean).

```sh
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github
git pull
cd hmu-bot/patreon
docker build . -t hmu-bot:latest
service docker.hmu restart

# remove outdated containers/images
docker container prune
docker image prune
```

On setup, I ran `systemctl enable docker.hmu`.
