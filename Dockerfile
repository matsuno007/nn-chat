FROM --platform=linux/x86_64 node:18.15.0-slim

RUN apt-get update && \
    apt-get install -y locales git procps vim tmux curl
RUN locale-gen ja_JP.UTF-8
RUN localedef -f UTF-8 -i ja_JP ja_JP
RUN yarn global add htpasswd@2.4.6
ENV LANG=ja_JP.UTF-8
ENV TZ=Asia/Tokyo
WORKDIR /app
COPY . /app
CMD ["sh", "run.sh"]

ARG USERNAME=node
# ARG PASSWORD=m_matsuno
ARG GROUPNAME=m_matsuno007
ARG UID=1000
ARG GID=1000
ARG HOME="/home/${USERNAME}"
# RUN groupadd -g $GID $GROUPNAME 
# RUN useradd -m -s /bin/bash -u $UID -g $GID $USERNAME

# パスワードを設定
# RUN echo "$USERNAME:$PASSWORD" | chpasswd

#sudoers ファイルに追加
RUN echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER $USERNAME