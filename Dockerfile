FROM ubuntu:latest
LABEL authors="mirna"

ENTRYPOINT ["top", "-b"]