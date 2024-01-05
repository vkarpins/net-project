FROM alpine:latest

WORKDIR /app

RUN apk add --update --no-cache nodejs npm go sqlite sqlite-dev

COPY . .

WORKDIR /app/backend
RUN go mod download
RUN go get -u github.com/mattn/go-sqlite3
RUN go build -o social-network-backend .
RUN chmod +x run.sh
RUN chmod +x social-network-backend

WORKDIR /app/frontend
RUN npm install

EXPOSE 3000 8080

CMD sh /app/backend/run.sh
