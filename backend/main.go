package main

import (
	"fmt"
	"log"
	"os"

	"dgui/config"
	"dgui/routes"
)

func main() {
	// 初始化配置
	config.InitConfig()

	// 设置 Gin 模式
	ginMode := os.Getenv("GIN_MODE")
	if ginMode != "" {
		_ = os.Setenv("GIN_MODE", ginMode)
	}

	// 初始化数据库
	config.InitDB()

	// 设置路由
	r := routes.SetupRouter()

	// 启动服务器
	port := config.GetPort()
	log.Printf("Starting server on port %s", port)
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
