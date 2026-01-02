FROM node:22-alpine AS frontend-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY frontend/ ./

RUN pnpm build

FROM golang:1.24-alpine AS backend-builder

WORKDIR /app

COPY backend/go.mod backend/go.sum ./

RUN go mod download

COPY backend/ ./

RUN CGO_ENABLED=0 GOOS=linux go build -o dgui .

FROM alpine:3.23 AS final

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata wget

ENV TZ=Asia/Shanghai

COPY --from=backend-builder /app/dgui /app/dgui

COPY --from=frontend-builder /app/dist /app/static

RUN mkdir -p /app/data

ENV GIN_MODE=release

# 暴露端口
EXPOSE 5008

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:5008/health || exit 1

# 启动服务
CMD ["/app/dgui"]
